param([long]$WindowHandle, [string]$Output, [string]$ExpectedBackground)
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
# Capture the displayed compositor surface without requesting a separate WM_PRINT repaint.
$screen = New-Object System.Drawing.Bitmap(($bounds.Right - $bounds.Left), ($bounds.Bottom - $bounds.Top))
$screenGraphics = [System.Drawing.Graphics]::FromImage($screen)
try {
  $screenGraphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $screen.Size)
  $screen.Save($Output, [System.Drawing.Imaging.ImageFormat]::Png)
  $colors = [System.Collections.Generic.HashSet[int]]::new()
  for ($y = 48; $y -lt $screen.Height - 20; $y += 3) {
    for ($x = 20; $x -lt $screen.Width - 20; $x += 3) { [void]$colors.Add($screen.GetPixel($x, $y).ToArgb()) }
  }
  if ($ExpectedBackground) {
    $actual = $screen.GetPixel(30, $screen.Height - 30)
    $expected = [System.Drawing.ColorTranslator]::FromHtml($ExpectedBackground)
    if ($actual.R -ne $expected.R -or $actual.G -ne $expected.G -or $actual.B -ne $expected.B) {
      throw "Native background did not update: expected $ExpectedBackground, got $actual"
    }
  }
  if ($colors.Count -lt 8) { throw "Native client area is blank ($($colors.Count) sampled colors); layout/events alone do not establish rendering." }
} finally { $screenGraphics.Dispose(); $screen.Dispose() }
