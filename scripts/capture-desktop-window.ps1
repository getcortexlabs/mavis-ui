param([long]$WindowHandle, [string]$Output)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class MavisWindowCapture {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hwnd, IntPtr hdc, uint flags);
}
'@
$bounds = New-Object MavisWindowCapture+RECT
if (-not [MavisWindowCapture]::GetWindowRect([IntPtr]$WindowHandle, [ref]$bounds)) { throw 'Cannot measure native window' }
$image = New-Object System.Drawing.Bitmap(($bounds.Right - $bounds.Left), ($bounds.Bottom - $bounds.Top))
$graphics = [System.Drawing.Graphics]::FromImage($image)
$context = $graphics.GetHdc()
try { if (-not [MavisWindowCapture]::PrintWindow([IntPtr]$WindowHandle, $context, 2)) { throw 'Cannot capture native window' } }
finally { $graphics.ReleaseHdc($context) }
try { $image.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png) }
finally { $graphics.Dispose(); $image.Dispose() }
# XAML is compositor-backed: capture the displayed pixels as well as WM_PRINT output.
$screen = New-Object System.Drawing.Bitmap(($bounds.Right - $bounds.Left), ($bounds.Bottom - $bounds.Top))
$screenGraphics = [System.Drawing.Graphics]::FromImage($screen)
try {
  $screenGraphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $screen.Size)
  $screen.Save(($Output -replace '\.png$', '-display.png'), [System.Drawing.Imaging.ImageFormat]::Png)
} finally { $screenGraphics.Dispose(); $screen.Dispose() }
