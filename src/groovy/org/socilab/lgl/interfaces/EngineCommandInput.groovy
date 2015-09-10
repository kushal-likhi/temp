package org.socilab.lgl.interfaces


interface EngineCommandInput {

    public void addListener(InputCommand inputCommand);

    public boolean listen();

}