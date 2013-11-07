setlocal
set appname=open-local-file

copy buildscript\makexpi.sh .\
bash makexpi.sh -n %appname% -o
del makexpi.sh
endlocal
