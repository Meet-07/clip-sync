Dim WshShell, fso, scriptDir, serverDir
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get absolute path of server directory (parent of scripts folder)
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverDir = fso.GetParentFolderName(scriptDir)

WshShell.CurrentDirectory = serverDir
' Launch node directly in silent mode (0 = hidden, False = non-blocking)
WshShell.Run "node src/index.js", 0, False

Set WshShell = Nothing
Set fso = Nothing
