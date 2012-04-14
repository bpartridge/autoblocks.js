osascript <<'AS'
tell application "Google Chrome"
	activate
	repeat with win in every window
		repeat with i from 1 to the number of tabs in win
			set t to tab i of win
			if the URL of t contains "localhost" then
				--close t
				set the active tab index of win to i
				reload t
				tell application "System Events"
					tell application process "Google Chrome"
						--keystroke "t" using {command down, shift down}
						--delay 1.5
						--keystroke "r" using {command down, shift down}
					end tell
				end tell
				exit repeat
			end if
		end repeat
	end repeat
end tell
AS
