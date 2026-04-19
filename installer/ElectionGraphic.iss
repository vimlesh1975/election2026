; Inno Setup script for offline Election Graphic service installer

#define AppPublisher "Election"
#define AppVersion "1.0.0"
#define ServiceExe "ElectionGraphicService.exe"
#define ServiceId "ElectionGraphicService"

; Optional override from ISCC:
;   ISCC.exe /DBuildName=election2026_YYYYMMDD_HHMMSS ElectionGraphic.iss
#ifndef BuildName
#define BuildName "ElectionGraphicInstaller"
#endif

; Match the installer/app title shown in Setup + Apps & Features to the build name.
#define AppName BuildName

[Setup]
AppId={{8D8B2C9C-5A0E-4CB0-9E9E-1CC7D2A8D5A1}
AppName={#AppName}
AppVersion={#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName={pf}\ElectionGraphic
DisableProgramGroupPage=yes
OutputDir=.
OutputBaseFilename={#BuildName}
Compression=lzma2
SolidCompression=yes
PrivilegesRequired=admin
ArchitecturesAllowed=x64
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; App payload (offline)
Source: "payload\app\*"; DestDir: "{app}\app"; Flags: recursesubdirs ignoreversion
; Private Node runtime
Source: "payload\runtime\node\*"; DestDir: "{app}\runtime\node"; Flags: recursesubdirs ignoreversion
; WinSW service wrapper + config
Source: "payload\runtime\winsw\{#ServiceExe}"; DestDir: "{app}\runtime\winsw"; Flags: ignoreversion
Source: "payload\runtime\winsw\{#ServiceId}.xml"; DestDir: "{app}\runtime\winsw"; Flags: ignoreversion

[Icons]
Name: "{group}\{#AppName}"; Filename: "http://localhost:16000"; IconFilename: "{app}\app\public\favicon.ico"; Flags: createonlyiffileexists

[Run]
; Install and start the service
Filename: "{app}\runtime\winsw\{#ServiceExe}"; Parameters: "install"; WorkingDir: "{app}\runtime\winsw"; Flags: runhidden
Filename: "{app}\runtime\winsw\{#ServiceExe}"; Parameters: "start"; WorkingDir: "{app}\runtime\winsw"; Flags: runhidden

[UninstallRun]
Filename: "{app}\runtime\winsw\{#ServiceExe}"; Parameters: "stop"; WorkingDir: "{app}\runtime\winsw"; Flags: runhidden
Filename: "{app}\runtime\winsw\{#ServiceExe}"; Parameters: "uninstall"; WorkingDir: "{app}\runtime\winsw"; Flags: runhidden

[Code]
function FileExistsInInstall(const RelativePath: string): Boolean;
begin
  Result := FileExists(ExpandConstant('{app}\' + RelativePath));
end;

procedure ReplaceInFile(const FileName, FindText, ReplaceText: string);
var
  S: string;
begin
  if LoadStringFromFile(FileName, S) then
  begin
    StringChangeEx(S, FindText, ReplaceText, True);
    SaveStringToFile(FileName, S, False);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssInstall then
  begin
    if not FileExistsInInstall('runtime\node\node.exe') then
      MsgBox('Node runtime missing: runtime\node\node.exe. Put Node 23.11.1 files into installer\payload\runtime\node before compiling.', mbError, MB_OK);
    if not FileExistsInInstall('runtime\winsw\' + '{#ServiceExe}') then
      MsgBox('WinSW missing: runtime\winsw\' + '{#ServiceExe}' + '. Put WinSW into installer\payload\runtime\winsw before compiling.', mbError, MB_OK);
  end;

  if CurStep = ssPostInstall then
  begin
    // Make the app/browser title match the installer build name.
    ReplaceInFile(ExpandConstant('{app}\runtime\winsw\{#ServiceId}.xml'), '__APP_TITLE__', '{#BuildName}');
  end;
end;
