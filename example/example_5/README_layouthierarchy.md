## Hierarchical wheel layout configuration

The wheel widget loads it cinfiguration from the `layouthierarchy.json`. The settings are described in the following table:

```
[
    "name": <interal unique id string forhierarchy idtem>,
    "image": <array of 3 base64 encoded png images ["img0","img1","img2"]>
            img0 - high resolution (approx 600x600)
            img1 - medium resolution (approx 300x300)
            img2 - medium resolution (approx 150x150) - (for top level view) 
    "isLeaf": <either "true" or "false" - is the hierarchy item a leaf node>
    "cId": <cluster unique id string>,
    "cName": <cluster name string>
    "displayName": <breadcrumb name string>
    "color": <CSS # color string for the cluster color segment"   
]
```

Use the Jupyter notebook in example/util/Display wheel settings.ipynb to examine the contents of the layouthierarchy.json