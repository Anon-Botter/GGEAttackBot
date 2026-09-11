package com.ggeattackbot.testoverlay

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray

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

  @ReactMethod
  fun configureTargets(targets: ReadableArray, intervalMilliseconds: Int) {
    val points = (0 until targets.size()).mapNotNull { index ->
      targets.getString(index)?.takeIf { it.matches(Regex("\\d+:\\d+")) }
    }
    context.getSharedPreferences("overlay-test", 0).edit()
      .putString("targets", points.joinToString(","))
      .putInt("intervalMilliseconds", intervalMilliseconds.coerceAtLeast(1000))
      .apply()
  }

  @ReactMethod
  fun openAccessibilitySettings() {
    val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    context.startActivity(intent)
  }

  @ReactMethod
  fun isTapServiceEnabled(promise: Promise) {
    promise.resolve(TestAccessibilityService.instance != null)
  }

  @ReactMethod
  fun tap(x: Int, y: Int, promise: Promise) {
    val service = TestAccessibilityService.instance
    if (service == null) {
      promise.reject("SERVICE_DISABLED", "Enable GGEAttackBot test taps in Android Accessibility settings.")
      return
    }
    promise.resolve(service.tap(x, y))
  }
}
