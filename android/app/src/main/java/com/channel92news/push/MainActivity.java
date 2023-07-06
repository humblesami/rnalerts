package com.channel92news.push;

import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import android.media.AudioAttributes;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import androidx.core.app.NotificationCompat;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import expo.modules.ReactActivityDelegateWrapper;

public class MainActivity extends ReactActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Set the theme to AppTheme BEFORE onCreate to support
        // coloring the background, status bar, and navigation bar.
        // This is required for expo-splash-screen.
        setTheme(R.style.AppTheme);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ntc = new NotificationChannel("down_alerts", "main", NotificationManager.IMPORTANCE_HIGH);
            AudioAttributes att = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_NOTIFICATION).
            setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build();
            ntc.setSound(Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + this.getPackageName() + "/raw/s4"), att);
            ntc.enableVibration(true);
            ntc.setVibrationPattern(new long[] { 400, 400 });
            ntc.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(ntc);
        }
        super.onCreate(null);
    }

    /**
    * Returns the name of the main component registered from JavaScript.
    * This is used to schedule rendering of the component.
    */
    @Override
    protected String getMainComponentName() {
        return "main";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegateWrapper(this, new ReactActivityDelegate(this, getMainComponentName()));
    }

    /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
    @Override
    public void invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                // For non-root activities, use the default implementation to finish them.
                super.invokeDefaultOnBackPressed();
            }
            return;
        }
        // Use the default back button implementation on Android S
        // because it's doing more than {@link Activity#moveTaskToBack} in fact.
        super.invokeDefaultOnBackPressed();
    }
}
