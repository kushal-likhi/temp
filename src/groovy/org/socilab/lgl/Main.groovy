package org.socilab.lgl

import org.socilab.lgl.gephi.GephiLayoutCalculator
import org.socilab.lgl.interfaces.EngineCommandInput
import org.socilab.lgl.interfaces.InputCommand
import org.socilab.lgl.interfaces.LayoutCalculator
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
            boolean calculate(String inputFileName, String outputFileName, Map settings) {
                println inputFileName
                println outputFileName
                println settings
                LayoutCalculator layoutCalculator = new GephiLayoutCalculator(
                        inputFileName,
                        outputFileName,
                        settings.allowAutoMode as Boolean,
                        settings.stepDisplacement as Float,
                        settings.optimalDistance as Float,
                        settings.iterations as Integer,
                        settings.saveSvg as Boolean
                )
                return layoutCalculator.calculate()
            }
        })
        engineCommandInput.listen()
    }

}
