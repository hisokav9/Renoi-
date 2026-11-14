import com.android.apksig.ApkSigner;
import com.android.apksig.ApkVerifier;

import java.io.File;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.Collections;

/**
 * Signe un APK (schéma v2, suffisant pour Android 7.0 et plus) avec la bibliothèque apksig de Google, puis vérifie le résultat.
 * Usage : FADA_KEY_PASS=… java -cp apksig.jar:. Signer <non-signé.apk> <signé.apk> <clé.p12> <alias> <minSdk>
 */
public class Signer {
    public static void main(String[] a) throws Exception {
        File in = new File(a[0]), out = new File(a[1]);
        char[] pass = System.getenv("FADA_KEY_PASS").toCharArray();
        KeyStore ks = KeyStore.getInstance("PKCS12");
        try (FileInputStream f = new FileInputStream(a[2])) { ks.load(f, pass); }
        PrivateKey key = (PrivateKey) ks.getKey(a[3], pass);
        X509Certificate cert = (X509Certificate) ks.getCertificate(a[3]);
        ApkSigner.SignerConfig sc = new ApkSigner.SignerConfig.Builder("FADA", key, Collections.singletonList(cert)).build();
        new ApkSigner.Builder(Collections.singletonList(sc))
                .setInputApk(in).setOutputApk(out)
                .setMinSdkVersion(Integer.parseInt(a[4]))
                .setV1SigningEnabled(false).setV2SigningEnabled(true) // v2 : vérifiée par Android 7.0+ (minSdk 24) ; le v1 de apksig 2.3.0 ne marche plus sur Java 21
                .build().sign();

        ApkVerifier.Result r = new ApkVerifier.Builder(out).build().verify();
        System.out.println("signature vérifiée : " + r.isVerified() + " (v1 " + r.isVerifiedUsingV1Scheme() + ", v2 " + r.isVerifiedUsingV2Scheme() + ")");
        for (Object e : r.getErrors()) System.out.println("ERREUR " + e);
        for (Object w : r.getWarnings()) System.out.println("avertissement " + w);
        if (!r.isVerified()) System.exit(2);
    }
}
