package handlers

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"time"

	"time-api/internal/config"
	"time-api/internal/database"
	"time-api/internal/models"
	"time-api/internal/session"

	"github.com/go-chi/chi/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"
)

var googleCfg *oauth2.Config

func init() {
	app := config.Load()
	googleCfg = &oauth2.Config{
		ClientID:     app.GoogleClientID,
		ClientSecret: app.GoogleClientSecret,
		RedirectURL:  app.GoogleRedirectURL,
		Scopes:       []string{"openid", "profile", "email"},
		Endpoint:     google.Endpoint,
	}
}

func AuthRoutes() chi.Router {
	r := chi.NewRouter()
	r.Get("/login", login)
	r.Get("/callback", callback)
	r.Get("/logout", logout)
	return r
}

const (
	sessionName     = "session"
	stateKey        = "oauth_state"
	stateExpKey     = "oauth_state_exp"
	userIDSession   = "user_id"
	stateTTLMinutes = 10
)

func login(w http.ResponseWriter, r *http.Request) {
	sess, err := session.Store().Get(r, sessionName)
	if err != nil {
		log.Printf("could not get session: %v", err)
	}

	var nonce [32]byte
	if _, err := rand.Read(nonce[:]); err != nil {
		http.Error(w, "could not start login", http.StatusInternalServerError)
		return
	}
	state := base64.RawURLEncoding.EncodeToString(nonce[:])

	sess.Values[stateKey] = state
	sess.Values[stateExpKey] = time.Now().Add(stateTTLMinutes * time.Minute).Unix()
	_ = sess.Save(r, w)

	http.Redirect(
		w, r,
		googleCfg.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce),
		http.StatusTemporaryRedirect,
	)
}

func callback(w http.ResponseWriter, r *http.Request) {
	sess, _ := session.Store().Get(r, sessionName)

	// CSRF / state validation
	storedState, ok := sess.Values[stateKey].(string)
	expUnix, expOK := sess.Values[stateExpKey].(int64)
	delete(sess.Values, stateKey)
	delete(sess.Values, stateExpKey)

	if !ok || !expOK || r.URL.Query().Get("state") != storedState || time.Now().Unix() > expUnix {
		_ = sess.Save(r, w)
		http.Error(w, "invalid state", http.StatusBadRequest)
		return
	}

	// Token exchange
	code := r.URL.Query().Get("code")
	token, err := googleCfg.Exchange(r.Context(), code)
	if err != nil {
		http.Error(w, "token exchange failed", http.StatusInternalServerError)
		return
	}

	// Fetch userinfo
	resp, err := googleCfg.Client(r.Context(), token).
		Get("https://openidconnect.googleapis.com/v1/userinfo")
	if err != nil {
		http.Error(w, "failed fetching userinfo", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var ui struct {
		Sub   string `json:"sub"`
		Email string `json:"email"`
	}
	body, _ := io.ReadAll(resp.Body)
	if err := json.Unmarshal(body, &ui); err != nil || ui.Sub == "" {
		http.Error(w, "invalid userinfo", http.StatusInternalServerError)
		return
	}

	// Upsert user
	db := database.DB()
	var user models.User
	switch err := db.Where("google_id = ?", ui.Sub).First(&user).Error; {
	case errors.Is(err, gorm.ErrRecordNotFound):
		user = models.User{GoogleID: ui.Sub, Email: ui.Email}
		if err := db.Create(&user).Error; err != nil {
			http.Error(w, "cannot create user", http.StatusInternalServerError)
			return
		}
	case err != nil:
		http.Error(w, "db error", http.StatusInternalServerError)
		return
	default:
		if ui.Email != "" && ui.Email != user.Email {
			_ = db.Model(&user).Update("email", ui.Email).Error
		}
	}

	sess.Values[userIDSession] = user.ID
	_ = sess.Save(r, w)

	http.Redirect(w, r, "/", http.StatusSeeOther)
}

func logout(w http.ResponseWriter, r *http.Request) {
	sess, _ := session.Store().Get(r, sessionName)
	sess.Options.MaxAge = -1
	_ = sess.Save(r, w)
	http.Redirect(w, r, "/", http.StatusSeeOther)
}
