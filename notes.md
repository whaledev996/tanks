# 9/3/2023
Trying to get collisions working again. Working a little bit better now. Did some more research and realized I have to use the BoundingBox model in order for this to work. Basically surround every object with bounding box, then use threejs intersectsBox method to tell if there is an intersection. This is checking the intersection well, but I still have the issue of the tank already getting stuck in the outer box.

UPDATE: collisions are working!