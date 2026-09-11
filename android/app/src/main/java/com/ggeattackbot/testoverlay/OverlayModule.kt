package com.ggeattackbot.testoverlay

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class OverlayModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName(): String = "TestOverlay"

  @ReactMethod
  fun show() {
    if (!Settings.canDrawOverlays(context)) {
      val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}"))
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
      return
    }
    context.startService(Intent(context, OverlayService::class.java))
  }

  @ReactMethod
  fun hide() {
    context.stopService(Intent(context, OverlayService::class.java))
  }
}
