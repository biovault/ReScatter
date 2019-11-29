### How to run the examples with docker

In this directory:

```bash
docker build .
docker run -d -p 8081:8081 3f23308d290b
```
Where 3f23308d290b should be replaced with the id of the image built. (-d is detached mode)

### Running the ReScatter examples without docker

Assuming you have python available the easiest way to view the examples is to start a simple HTTP server. Open a terminal, go to this direcory and run

python2
```
python -m SimpleHTTPServer 8081
```

or

python3
```
python -m http.server 8081
```

where 8888 is the optional port number (default is 80). Navigate to localhost:8888 to browse the ReScatter examples.


