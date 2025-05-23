package handlers

import (
    "context"
    "encoding/json"
    "net/http"
    "time-api/internal/config"
    "time-api/internal/database"
    "time-api/internal/models"
    "time-api/internal/session"

    "github.com/go-chi/chi/v5"
    "golang.org/x/oauth2"
    "golang.org/x/oauth2/google"
)

func AuthRoutes(cfg config.Config) http.Handler {
    r := chi.NewRouter()
    oauthCfg := &oauth2.Config{
        ClientID:     cfg.GoogleClientID,
        ClientSecret: cfg.GoogleClientSecret,
        RedirectURL:  cfg.OauthRedirectURL,
        Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
        Endpoint:     google.Endpoint,
    }
    const state = "csrf"

    r.Get("/login", func(w http.ResponseWriter, _ *http.Request) {
        url := oauthCfg.AuthCodeURL(state, oauth2.AccessTypeOnline)
        http.Redirect(w, nil, url, http.StatusTemporaryRedirect)
    })

    r.Get("/callback", func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Query().Get("state") != state {
            http.Error(w, "invalid oauth state", http.StatusBadRequest)
            return
        }
        tok, err := oauthCfg.Exchange(context.Background(), r.URL.Query().Get("code"))
        if err != nil {
            http.Error(w, "exchange failed", http.StatusBadRequest)
            return
        }
        resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + tok.AccessToken)
        if err != nil || resp.StatusCode != http.StatusOK {
            http.Error(w, "userinfo request failed", http.StatusBadRequest)
            return
        }
        defer resp.Body.Close()
        var g struct {
            ID            string `json:"id"`
            Email         string `json:"email"`
            VerifiedEmail bool   `json:"verified_email"`
            Picture       string `json:"picture"`
        }
        if err := json.NewDecoder(resp.Body).Decode(&g); err != nil {
            http.Error(w, "decode failed", http.StatusBadRequest)
            return
        }

        db := database.DB()
        var u models.User
        db.FirstOrCreate(&u, models.User{GoogleID: g.ID})
        db.Model(&u).Updates(models.User{
            Email:         g.Email,
            VerifiedEmail: g.VerifiedEmail,
            Picture:       g.Picture,
        })

        sess, _ := session.Store().Get(r, "sess")
        sess.Values["uid"] = u.ID
        _ = sess.Save(r, w)

        http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
    })

    r.Get("/logout", func(w http.ResponseWriter, r *http.Request) {
        sess, _ := session.Store().Get(r, "sess")
        sess.Values["uid"] = uint(0)
        _ = sess.Save(r, w)
        w.WriteHeader(http.StatusNoContent)
    })

    return r
}
