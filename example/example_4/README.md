## Example 2 : 60000 Mnist points and Canvas Based choropleth plugin

##### Goals of the example:

1. Increase the MINIST plot from 10000 to 60000 points, still responsive
2. Improve responsiveness of the choropleth using an HTML canvas based plugin

##### Steps

To display the alternative MNIST data simply generate the tsne map and convert to the the json format:

__t_SNE plot file [MNIST60000.json](../data/MNIST60000.json)
```json
{"dims": 2, "points": [[21.07517433166504, 0.591637134552002],

// 59998 other coordinates

[12.84904670715332, -20.513036727905273]]}

```

Extend the plot properties file) (to 60000 points
__plot properties [digit_label_60000.json](../data/digit_label_60000.json)__
```json
```
