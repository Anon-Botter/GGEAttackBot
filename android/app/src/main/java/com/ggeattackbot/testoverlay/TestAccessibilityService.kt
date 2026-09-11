package com.ggeattackbot.testoverlay

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.view.accessibility.AccessibilityEvent

class TestAccessibilityService : AccessibilityService() {
  companion object {
    var instance: TestAccessibilityService? = null
      private set
  }

  override fun onServiceConnected() {
    instance = this
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

  override fun onInterrupt() = Unit

  override fun onDestroy() {
    instance = null
    super.onDestroy()
  }

  fun tap(x: Int, y: Int): Boolean {
    val path = Path().apply { moveTo(x.toFloat(), y.toFloat()) }
    val gesture = GestureDescription.Builder()
      .addStroke(GestureDescription.StrokeDescription(path, 0, 60))
      .build()
    return dispatchGesture(gesture, null, null)
  }
}
