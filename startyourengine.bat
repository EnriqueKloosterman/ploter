@echo off     

title <nombre de la app>  

echo levanatando el servidor Backend...
start "Server" cmd /k "cd <carpeta a abrir> && <comando para arrancar la app>"

echo levantando el cliente...
start "Cliente" cmd /k "cd <carpeta a abrir> && <comando para arrancar la app>"

echo Cerrando esta ventana en  5 segundos...
timeout /t 5 /nobreak >nul

echo Abriendo el navegador...
start <url cliente> 


