kill $(ps aux | grep 'node-gephi-lgl.jar' | awk '{print $2}') || true