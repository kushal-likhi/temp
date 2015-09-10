package org.socilab.lgl.interfaces


interface InputCommand {

    public boolean isReady();

    public boolean calculate(String inputFileName, String outputFileName);

}