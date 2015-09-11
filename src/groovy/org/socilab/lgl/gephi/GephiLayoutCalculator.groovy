package org.socilab.lgl.gephi

import org.socilab.lgl.interfaces.LayoutCalculator


class GephiLayoutCalculator implements LayoutCalculator {

    private String inFile, outFile

    public GephiLayoutCalculator(String infile, String outFile) {
        this.inFile = infile
        this.outFile = outFile
    }

    @Override
    boolean calculate() {
        return false
    }
}
