package com.fadaroyale.game;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Fada Royale pour Android : une WebView plein écran qui affiche le jeu web (index.html, src/, assets/, lib/).
 *
 * Les fichiers du jeu sont dans l'APK (assets/www) et servis sous une adresse https locale
 * (https://appassets.androidplatform.net/…, jamais envoyée sur le réseau) : les modules JavaScript
 * et le localStorage (profil, réglages) exigent une vraie origine, ce que file:// ne fournit pas.
 */
public class MainActivity extends Activity {
    static final String HOST = "appassets.androidplatform.net";
    static final String HOME = "https://" + HOST + "/index.html";

    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON | WindowManager.LayoutParams.FLAG_FULLSCREEN);
        if (Build.VERSION.SDK_INT >= 28) {
            // dessiner aussi sous l'encoche de la caméra
            WindowManager.LayoutParams lp = w.getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            w.setAttributes(lp);
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(27, 18, 9));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);                 // localStorage : profil, réglages, missions
        s.setMediaPlaybackRequiresUserGesture(false); // sons du jeu
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                return serve(req.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                // liens externes (crédits des modèles 3D) : ouverts dans le navigateur du téléphone
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* aucun navigateur */ }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        setContentView(web);
        hideSystemBars();
        web.loadUrl(HOME);
    }

    /** Sert un fichier du jeu depuis l'APK ; les autres adresses (polices Google) passent par le réseau normal. */
    private WebResourceResponse serve(Uri u) {
        if (!HOST.equals(u.getHost())) return null;
        String path = u.getPath();
        if (path == null || path.length() <= 1) path = "/index.html";
        if (path.contains("..")) return notFound();
        try {
            InputStream in = getAssets().open("www" + path);
            String mime = mimeOf(path);
            WebResourceResponse r = new WebResourceResponse(mime, mime.startsWith("text/") || mime.endsWith("json") ? "utf-8" : null, in);
            Map<String, String> h = new HashMap<String, String>();
            h.put("Cache-Control", "no-cache");
            h.put("Access-Control-Allow-Origin", "*");
            r.setResponseHeaders(h);
            return r;
        } catch (Exception e) {
            return notFound();
        }
    }

    private static WebResourceResponse notFound() {
        return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<String, String>(), null);
    }

    private static String mimeOf(String p) {
        String l = p.toLowerCase();
        if (l.endsWith(".html") || l.endsWith(".htm")) return "text/html";
        if (l.endsWith(".js") || l.endsWith(".mjs")) return "text/javascript";
        if (l.endsWith(".css")) return "text/css";
        if (l.endsWith(".json")) return "application/json";
        if (l.endsWith(".png")) return "image/png";
        if (l.endsWith(".jpg") || l.endsWith(".jpeg")) return "image/jpeg";
        if (l.endsWith(".webp")) return "image/webp";
        if (l.endsWith(".svg")) return "image/svg+xml";
        if (l.endsWith(".woff2")) return "font/woff2";
        if (l.endsWith(".glb")) return "model/gltf-binary";
        if (l.endsWith(".wasm")) return "application/wasm";
        return "application/octet-stream";
    }

    /** Plein écran immersif : barres du système masquées, elles réapparaissent d'un glissement depuis le bord. */
    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        View d = getWindow().getDecorView();
        d.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    /**
     * Bouton retour : en partie, il met en pause (ou reprend) ; dans le lobby, il ferme le panneau ouvert ;
     * à l'accueil du lobby, il quitte l'application.
     */
    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (web == null) { super.onBackPressed(); return; }
        String js = "(function(){try{var F=window.FR;"
                + "if(F&&(F.state==='play'||F.state==='bus')){if(F.paused)F.closeSettings();else F.openSettings();return 'jeu';}"
                + "var m=document.getElementById('lbModes');if(m&&!m.classList.contains('hidden')){m.classList.add('hidden');return 'jeu';}"
                + "var p=document.getElementById('lbPanel');if(p&&!p.classList.contains('hidden')){document.getElementById('lbPClose').click();return 'jeu';}"
                + "var st=document.getElementById('settings');if(st&&!st.classList.contains('hidden')&&F){F.closeSettings();return 'jeu';}"
                + "}catch(e){}return 'quitter';})()";
        web.evaluateJavascript(js, new ValueCallback<String>() {
            @Override
            public void onReceiveValue(String v) {
                if (v == null || v.contains("quitter")) finish();
            }
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (web != null) web.onPause(); // la page passe « cachée » : le jeu coupe le son
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
        hideSystemBars();
    }

    @Override
    protected void onDestroy() {
        if (web != null) { web.destroy(); web = null; }
        super.onDestroy();
    }
}
