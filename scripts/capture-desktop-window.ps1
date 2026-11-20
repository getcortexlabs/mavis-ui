param([long]$WindowHandle, [string]$Output)
Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class MavisWindowCapture {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left, Top, Right, Bottom; }
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
}
'@
$bounds = New-Object MavisWindowCapture+RECT
if (-not [MavisWindowCapture]::GetWindowRect([IntPtr]$WindowHandle, [ref]$bounds)) { throw 'Cannot measure native window' }
# Capture the displayed compositor surface. Sending WM_PRINT to an XAML Island
# can clear its client area; do not use PrintWindow before the screen capture.
$screen = New-Object System.Drawing.Bitmap(($bounds.Right - $bounds.Left), ($bounds.Bottom - $bounds.Top))
$screenGraphics = [System.Drawing.Graphics]::FromImage($screen)
try {
  $screenGraphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $screen.Size)
  $screen.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
} finally { $screenGraphics.Dispose(); $screen.Dispose() }
