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
Source: "payload\runtime\node\node.exe"; DestDir: "{app}\runtime\node"; Flags: ignoreversion
Source: "payload\runtime\node\*"; DestDir: "{app}\runtime\node"; Flags: recursesubdirs ignoreversion; Excludes: "node.exe"
; WinSW service wrapper + config
Source: "payload\runtime\winsw\{#ServiceExe}"; DestDir: "{app}\runtime\winsw"; Flags: ignoreversion
Source: "payload\runtime\winsw\{#ServiceId}.xml"; DestDir: "{app}\runtime\winsw"; Flags: ignoreversion
; Service launcher (builds if needed, then starts Next)
Source: "runtime\service.js"; DestDir: "{app}\runtime\service"; Flags: ignoreversion

[Dirs]
Name: "{app}\runtime\winsw\logs"
Name: "{app}\runtime\service"

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
  A: AnsiString;
  U: string;
begin
  if LoadStringFromFile(FileName, A) then
  begin
    U := String(A);
    StringChangeEx(U, FindText, ReplaceText, True);
    A := AnsiString(U);
    SaveStringToFile(FileName, A, False);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    if not FileExistsInInstall('runtime\node\node.exe') then
    begin
      MsgBox('Node runtime missing in installation folder. This installer package is incomplete.', mbCriticalError, MB_OK);
      RaiseException('Node runtime missing.');
    end;

    if not FileExistsInInstall('runtime\winsw\' + '{#ServiceExe}') then
    begin
      MsgBox('WinSW service wrapper missing in installation folder. This installer package is incomplete.', mbCriticalError, MB_OK);
      RaiseException('WinSW missing.');
    end;

    // Make the app/browser title match the installer build name.
    ReplaceInFile(ExpandConstant('{app}\runtime\winsw\{#ServiceId}.xml'), '__APP_TITLE__', '{#BuildName}');
  end;
end;
