@echo off
echo Starting WSL2 setup script...

REM Open WSL and run the setup script
wsl -e /bin/bash -c "cd /mnt/c/Users/Michal/Desktop/TuneScript/devtools && ./setup_dev_env.sh"
