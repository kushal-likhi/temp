package org.socilab.lgl.server

import com.sun.net.httpserver.Headers
import com.sun.net.httpserver.HttpExchange
import com.sun.net.httpserver.HttpHandler
import com.sun.net.httpserver.HttpServer
import groovy.json.JsonSlurper
import org.socilab.lgl.interfaces.EngineCommandInput
import org.socilab.lgl.interfaces.InputCommand

import java.util.concurrent.Executors


class HTTPServer implements EngineCommandInput {

    private Integer port
    private InputCommand inputCommandListener
    private InetSocketAddress isa
    private HttpServer server
    private HttpHandler handler

    public HTTPServer(Integer port) {
        this.port = port;
        isa = new InetSocketAddress(9999)
        server = HttpServer.create(isa, 0)
        bindEndpoints();
    }

    public void terminate() {
        server.stop(0)
    }

    @Override
    void addListener(InputCommand inputCommand) {
        inputCommandListener = inputCommand;
    }

    @Override
    boolean listen() {
        println("starting with port " + port)
        try {
            server.start()
            return true
        } catch (Exception e) {
            e.printStackTrace()
            return false;
        }
    }

    private bindEndpoints() {
        handler = new HttpHandler() {
            public void handle(HttpExchange httpExchange) throws IOException {
                if (httpExchange.getRequestMethod().equalsIgnoreCase("POST")) {
                    InputStream is = httpExchange.getRequestBody()
                    String payload = is.getText()
                    Map data = new JsonSlurper().parseText(payload) as Map
                    String message;
                    if (data.containsKey("source") && data.containsKey("target")) {
                        Boolean resp = inputCommandListener.calculate(data.source as String, data.target as String);
                        message = resp ? 'OK' : 'ERR'
                    } else {
                        message = 'Invalid JSON body'
                    }
                    Headers responseHeaders = httpExchange.getResponseHeaders();
                    responseHeaders.set("Content-Type", "text/plain");
                    httpExchange.sendResponseHeaders(200, 0);
                    OutputStream responseBody = httpExchange.getResponseBody();
                    responseBody.write(message.bytes);
                    responseBody.close();
                }
            }
        }
        server.createContext("/calculate", handler)
        server.setExecutor(Executors.newCachedThreadPool())
    }
}
