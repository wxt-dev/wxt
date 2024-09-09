# VHS documentation
#
# You can view all VHS documentation on the command line with `vhs manual`.
# Or see https://github.com/charmbracelet/vhs#vhs-command-reference

# Output file
Output docs/public/demo.gif

# The tools we will use
Require pnpm


# === Scene ====
Set Width 1400
Set Height 800

# The maximum FPS for GIF is `50` FPS.
Set Framerate 50

# Terminal theme with WXT brand colors (which was taken from the website)
# Based on the standard charmbracelet/vhs theme:
# https://github.com/charmbracelet/vhs/blob/88e634f4a10bbe305b6aea9a12b4d8dc3dd7f31c/style.go#L7-L28
Set Theme {"background": "#1a1b1a", "foreground": "#dddddd", "black": "#282a2e", "brightBlack": "#4d4d4d", "red": "#D74E6F", "brightRed": "#FE5F86", "green": "#67d45e", "brightGreen": "#67d45e", "yellow": "#D3E561", "brightYellow": "#EBFF71", "blue": "#8056FF", "brightBlue": "#9B79FF", "magenta": "#ED61D7", "brightMagenta": "#FF7AEA", "cyan": "#04D7D7", "brightCyan": "#00FEFE", "white": "#bfbfbf", "brightWhite": "#e6e6e6", "indigo": "#5B56E0"}
Set FontSize 32

# Terminal settings
Set Shell "bash"

# Terminal prompt. It looks like "● mycommand ..."
Env PS1 "\e[0;32m●\e[0m "


# ===== Preparation =====
# Steps to prepare the recording environment, ensuring a clean and isolated setup.

Hide
# Create a temporary folder for demo
Type 'vhs_sandbox="$(mktemp -d)"' Enter
Type 'cd "$vhs_sandbox"' Enter
Type 'clear' Enter
Show


# ===== Actions =====

Type 'pnpm dlx wxt@latest init .' Sleep 1s Enter
Sleep 3.25s
Down@750ms Enter@750ms # Select `vue` template
Sleep 1.25s
Down@750ms Enter@750ms # Select `pnpm` as a package manager
Sleep 5s


# ===== Cleaning =====

Hide
# Delete the temporary folder
Type 'rm -rf "$vhs_sandbox"' Enter
Show
