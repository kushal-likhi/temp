package org.socilab.lgl

import org.socilab.lgl.interfaces.EngineCommandInput
import org.socilab.lgl.interfaces.InputCommand
import org.socilab.lgl.server.HTTPServer

public class Main {

    public static void main(String[] args) {
        println "Initialising GEPHI Layout engine!"
        EngineCommandInput engineCommandInput = new HTTPServer(args[0] as Integer)
        engineCommandInput.addListener(new InputCommand() {
            @Override
            boolean isReady() {
                return true
            }

            @Override
            boolean calculate(String inputFileName, String outputFileName) {
                println inputFileName
                println outputFileName
                return true
            }
        })
        engineCommandInput.listen()
    }

}
