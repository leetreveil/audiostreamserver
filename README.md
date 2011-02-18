This project is now dead - I will be moving the project over to nodejs when nodejs works correctly on Windows :)


audiostreamserver quick setup instructions
================================

* start the server at ./src/server/bin/start.bat (windows)
* use curl to tell the server to start watching a folder: curl -X POST localhost:8080/admin/monitoredfolders?path=[your_path]
* open <http://localhost:8080> in your browser to view the client.