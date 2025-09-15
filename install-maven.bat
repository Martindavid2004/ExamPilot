@echo off
echo Installing Apache Maven...
echo.

REM Create tools directory
if not exist "C:\tools" mkdir "C:\tools"
cd /d "C:\tools"

REM Download Maven (using PowerShell)
echo Downloading Maven 3.9.6...
powershell -Command "Invoke-WebRequest -Uri 'https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip' -OutFile 'maven.zip'"

REM Extract Maven
echo Extracting Maven...
powershell -Command "Expand-Archive -Path 'maven.zip' -DestinationPath 'C:\tools' -Force"

REM Rename folder
if exist "apache-maven-3.9.6" ren "apache-maven-3.9.6" "maven"

REM Clean up
del maven.zip

echo.
echo Maven installed to C:\tools\maven
echo.
echo Now setting environment variables...

REM Set environment variables for current session
set "M2_HOME=C:\tools\maven"
set "MAVEN_HOME=C:\tools\maven"
set "PATH=%PATH%;C:\tools\maven\bin"

echo.
echo Testing Maven installation...
C:\tools\maven\bin\mvn -version

echo.
echo Maven is ready! You can now run Maven commands.
echo.
echo To make this permanent, add the following to your system PATH:
echo C:\tools\maven\bin
echo.
pause
