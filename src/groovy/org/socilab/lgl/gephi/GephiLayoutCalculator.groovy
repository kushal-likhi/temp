package org.socilab.lgl.gephi

import org.gephi.data.attributes.api.AttributeController
import org.gephi.data.attributes.api.AttributeModel
import org.gephi.graph.api.GraphController
import org.gephi.graph.api.GraphModel
import org.gephi.graph.api.UndirectedGraph
import org.gephi.io.exporter.api.ExportController
import org.gephi.io.importer.api.Container
import org.gephi.io.importer.api.EdgeDefault
import org.gephi.io.importer.api.ImportController
import org.gephi.io.processor.plugin.DefaultProcessor
import org.gephi.layout.plugin.force.StepDisplacement
import org.gephi.layout.plugin.force.yifanHu.YifanHuLayout
import org.gephi.project.api.ProjectController
import org.gephi.project.api.Workspace
import org.openide.util.Lookup
import org.socilab.lgl.interfaces.LayoutCalculator

import static org.gephi.io.exporter.api.ExportController.*


class GephiLayoutCalculator implements LayoutCalculator {

    private String inFile, outFile
    private ProjectController pc
    private Workspace workspace
    private ImportController importController
    private GraphModel graphModel
    private AttributeModel attributeModel
    private Container container
    private UndirectedGraph graph

    public GephiLayoutCalculator(String infile, String outFile) {
        this.inFile = infile
        this.outFile = outFile
        initializeGephiProject()
    }

    @Override
    boolean calculate() {
        println "Calculation using Gephi"
        try {
            importGraph()
            runLayoutAlgorithm()
            exportToOutFile()
            return true
        } catch (Exception e) {
            e.printStackTrace()
            return false
        }
    }

    private initializeGephiProject() {
        //Init a project - and therefore a workspace
        pc = Lookup.getDefault().lookup(ProjectController.class);
        pc.newProject();
        workspace = pc.getCurrentWorkspace();
        //Get controllers and models
        importController = Lookup.getDefault().lookup(ImportController.class);
        graphModel = Lookup.getDefault().lookup(GraphController.class).getModel();
        attributeModel = Lookup.getDefault().lookup(AttributeController.class).getModel();
    }

    private importGraph() {
        File inputFile = new File(inFile)
        container = importController.importFile(inputFile);
        container.setAllowAutoNode(false); //Don't create missing nodes
        container.getLoader().setEdgeDefault(EdgeDefault.UNDIRECTED);   //Force UNDIRECTED
        //Append imported data to GraphAPI
        importController.process(container, new DefaultProcessor(), workspace);
        //See if graph is well imported
        graph = graphModel.getUndirectedGraph();
        println("Nodes: " + graph.getNodeCount());
        println("Edges: " + graph.getEdgeCount());
    }

    private void runLayoutAlgorithm() {
        YifanHuLayout layout = new YifanHuLayout(null, new StepDisplacement(1f));
        layout.setGraphModel(graphModel);
        layout.resetPropertiesValues();
        layout.setOptimalDistance(200f);
        layout.initAlgo();

        for (int i = 0; i < 100 && layout.canAlgo(); i++) {
            layout.goAlgo();
        }
        layout.endAlgo();
    }

    private void exportToOutFile(){
        ExportController ec = Lookup.getDefault().lookup(ExportController.class);
        try {
            ec.exportFile(new File(outFile));
        } catch (IOException ex) {
            ex.printStackTrace();
            return;
        }
        throw new Exception('Not Supported')
    }
}
