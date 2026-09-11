package com.ggeattackbot.testoverlay

import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.IBinder
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class OverlayService : Service() {
  private lateinit var windowManager: WindowManager
  private var overlay: View? = null
  private val handler = Handler(Looper.getMainLooper())
  private var targetIndex = 0
  private var running = false
  private lateinit var status: TextView
  private lateinit var startStop: Button

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (overlay == null) showOverlay()
    return START_NOT_STICKY
  }

  private fun showOverlay() {
    windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
    val panel = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(28, 20, 28, 20)
      setBackgroundColor(Color.rgb(23, 35, 41))
      elevation = 16f
    }
    panel.addView(TextView(this).apply {
      text = "GGEAttackBot\nTEST OVERLAY"
      setTextColor(Color.rgb(245, 200, 82))
      textSize = 18f
    })
    status = TextView(this).apply {
      text = "Ready\nHold and drag to move"
      setTextColor(Color.WHITE)
      textSize = 13f
      setPadding(0, 12, 0, 0)
    }
    startStop = Button(this).apply {
      text = "START"
      setOnClickListener { if (running) stopSequence() else startSequence() }
    }
    panel.addView(status)
    panel.addView(startStop)

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.WRAP_CONTENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
      PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.END
      x = 24
      y = 180
    }

    panel.setOnTouchListener(object : View.OnTouchListener {
      private var startX = 0
      private var startY = 0
      private var downX = 0f
      private var downY = 0f

      override fun onTouch(view: View, event: MotionEvent): Boolean {
        when (event.action) {
          MotionEvent.ACTION_DOWN -> {
            startX = params.x
            startY = params.y
            downX = event.rawX
            downY = event.rawY
            return true
          }
          MotionEvent.ACTION_MOVE -> {
            params.x = startX - (event.rawX - downX).toInt()
            params.y = startY + (event.rawY - downY).toInt()
            windowManager.updateViewLayout(panel, params)
            return true
          }
          MotionEvent.ACTION_UP -> {
            if (kotlin.math.abs(event.rawX - downX) < 12 && kotlin.math.abs(event.rawY - downY) < 12) view.performClick()
            return true
          }
        }
        return false
      }
    })

    overlay = panel
    windowManager.addView(panel, params)
  }

  override fun onDestroy() {
    stopSequence()
    overlay?.let { windowManager.removeView(it) }
    overlay = null
    super.onDestroy()
  }

  private fun startSequence() {
    if (TestAccessibilityService.instance == null) {
      status.text = "Enable GGEAttackBot test taps\nin Accessibility settings"
      return
    }
    if (targets().isEmpty()) {
      status.text = "Add test X:Y targets\nin GGEAttackBot settings"
      return
    }
    running = true
    startStop.text = "STOP"
    runNextTarget()
  }

  private fun stopSequence() {
    running = false
    handler.removeCallbacksAndMessages(null)
    if (::startStop.isInitialized) startStop.text = "START"
    if (::status.isInitialized) status.text = "Paused"
  }

  private fun runNextTarget() {
    if (!running) return
    val targets = targets()
    if (targets.isEmpty()) {
      stopSequence()
      return
    }
    val point = targets[targetIndex % targets.size]
    val parts = point.split(":")
    val accepted = TestAccessibilityService.instance?.tap(parts[0].toInt(), parts[1].toInt()) == true
    status.text = if (accepted) "Tapped $point\n${targetIndex % targets.size + 1} of ${targets.size}" else "Tap was not accepted"
    targetIndex = (targetIndex + 1) % targets.size
    val interval = getSharedPreferences("overlay-test", 0).getInt("intervalMilliseconds", 60000)
    handler.postDelayed({ runNextTarget() }, interval.toLong())
  }

  private fun targets(): List<String> = getSharedPreferences("overlay-test", 0)
    .getString("targets", "")
    .orEmpty()
    .split(",")
    .filter { it.matches(Regex("\\d+:\\d+")) }
}
