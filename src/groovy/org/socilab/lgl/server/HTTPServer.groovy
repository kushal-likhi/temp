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
        isa = new InetSocketAddress(this.port)
        server = HttpServer.create(isa, 0)
        bindEndpoints();
    }

    @Override
    public void terminate() {
        server.stop(0)
    }

    @Override
    void addListener(InputCommand inputCommand) {
        inputCommandListener = inputCommand
    }

    @Override
    boolean listen() {
        println("starting with port " + isa.port + ' with ' + isa.address)
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
                    String message
                    Integer status
                    InputStream is = httpExchange.getRequestBody()
                    String payload = is.getText()
                    Map data = new JsonSlurper().parseText(payload) as Map
                    if (data.containsKey("source") && data.containsKey("target")) {
                        Boolean resp = inputCommandListener.calculate(data.source as String, data.target as String)
                        message = resp ? 'OK' : 'Error in Calculation'
                        status = resp ? 200 : 203
                    } else {
                        message = 'Invalid JSON body'
                        status = 204
                    }
                    Headers responseHeaders = httpExchange.getResponseHeaders()
                    responseHeaders.set("Content-Type", "text/plain")
                    httpExchange.sendResponseHeaders(status, 0)
                    OutputStream responseBody = httpExchange.getResponseBody()
                    responseBody.write(message.bytes)
                    responseBody.close()
                }
            }
        }
        server.createContext("/calculate", handler)
        server.setExecutor(Executors.newCachedThreadPool())
    }
}
