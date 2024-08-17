package main
import (
        "context"
        "encoding/json"
        "fmt"
//        "log"
        "net/http"
        "io"
        "golang.org/x/oauth2"
        "golang.org/x/oauth2/google"
)

var (
        googleOauthConfig *oauth2.Config
        oauthStateString  = "random"
)

func init() {
        googleOauthConfig = &oauth2.Config{
                RedirectURL:  "https://time.saeculum.net/auth",
                ClientID:     "20294282467-hfbrb8b9gns1g1opn8qhp1n3v4s8f93h.apps.googleusercontent.com", // replace with your client ID
                ClientSecret: "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", // replace with your client secret
                Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email"},
                Endpoint:     google.Endpoint,
        }
}



func handleMain(w http.ResponseWriter, r *http.Request) {
        var htmlIndex = `<html><body><a href="/login">Google Log In</a></body></html>`
        fmt.Fprintf(w, htmlIndex)
}

func handleGoogleLogin(w http.ResponseWriter, r *http.Request) {
        url := googleOauthConfig.AuthCodeURL(oauthStateString)
        http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func handleGoogleCallback(w http.ResponseWriter, r *http.Request){
        content, err := getUserInfo(r.FormValue("state"), r.FormValue("code"))
        if err != nil {
                fmt.Println("Error getting user info: ", err)
                http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
                return 
        }


        //fmt.Fprintf(w, "ID: %s", content.ID)
        
        db := initDB()
        db.FirstOrCreate(&content, User{ID: content.ID, Email: content.Email, VerifiedEmail: content.VerifiedEmail, Picture: content.Picture})
        sqlDB, _ := db.DB()
        defer sqlDB.Close()
        storeGoogleUserInfo(content, w, r)
        // goto /app
        http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
}

func getUserInfo(state string, code string) (User, error) {
        if state != oauthStateString {
                return User{}, fmt.Errorf("invalid oauth state")
        }

        token, err := googleOauthConfig.Exchange(context.Background(), code)
        if err != nil {
                return User{}, fmt.Errorf("code exchange failed: %s", err.Error())
        }

        response, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
        if err != nil {
                return User{}, fmt.Errorf("failed getting user info: %s", err.Error())
        }
        defer response.Body.Close()

        content, err := io.ReadAll(response.Body)
        if err != nil {
                return User{}, fmt.Errorf("failed reading response body: %s", err.Error())
        }

        var user User
        err = json.Unmarshal(content, &user)
        if err != nil {
                return User{}, fmt.Errorf("JSON unmarshal error: %s", err.Error())
        }

        return user, nil
}
