## Dualview t-SNE

One of the design goals of ReScatter was to support the display of so-called
dual-view t-SNE plots. To understand the selection mappings it is essential
to understand how the dual-view plots are created with t-SNE.

#### The data MNIST

The [MNIST data](https://en.wikipedia.org/wiki/MNIST_database) used for calculating
the t-SNE maps and for displaying the pixel/digit influence can be examined in the
[NRRD format](http://teem.sourceforge.net/nrrd/index.html) (for Nearly Raw Raster Data)
which is used in ReScatter as convenient way of handling bulk float data. The NRRD
 ile representa a matrix of 10000 by 784. This represents 10000 digit images each
 of which has a 28x28 pixel raster. The pixel values are normalize between 0 and 1.0
 and stored as little endian float 32.

#### Creating the dual view plots

t-SNE is a dimensionality reduction technique. Data points have multiple values
each representing a measurement dimension. In the case of MNIST the conventional
the t-SNE way of grouping the digit images is to regard each image as a data point and each pixel
as a dimension. Running t-SNE gives a the "Digits" plot shown on this example page.
This plot arranges images points in 2D based on their high (784) dimensional similarity.
As is well know this clusters similar digits together.

The second plot, "Pixels" results from running t-SNE on the transposed data matrix.
This results in data points representing pixels being arranged based on their
high (10000) dimensionality expression in the image space. The result in this case
is to group pixels together based on their significance in the images. We clearly see
a circular cluster at the bottom corresponding to pixels that are

##### Appendix: Creating the tsne plots

The tsne plots can be reproduced as follows:

* Read the raw MNIST data from the nrrd and write the matrix and transpose matrix to a file:

```python
import nrrd
import numpy as np
data, opts = nrrd.read('np10000x784.nrrd')
d_mat_784 = np.transpose(data)

# write the raw 10000x784 data
with open('d_mat_10000.bin', 'w') as f:
    data.tofile(f)

# write the raw 784x10000 data
with open('d_mat_784.bin', 'w') as f:
    d_mat_784.tofile(f)


```

* Perform tsne on the two matrices (using atsne_cmd with d

```bash
# tSNE to created the Digits plot
./atsne_cmd d_mat_10000.bin d_mat_tsne_10000.bin 10000 784

# tSNE to created the Pixel plot
# (various parameters are adjusted from the defaults because of the lower number of points)
./atsne_cmd d_mat_784.bin d_mat_784_tsne.bin 784 10000 -p 9 -x 150 -i 5000
```

* Convert the plots to ReScatter JSON plot format
```python
import numpy as np
import json
# The Pixels plot to json
plot_arr = np.fromfile('d_mat_784_tsne.bin', dtype=np.float32).reshape((784,2))
plot_coords = {"dims": 2, "tsneMap": plot_arr.tolist()}
with open('MNIST784.json', 'w') as f:
    json.dump(plot_coords, f)

# The Digits plot to json
plot_arr = np.fromfile('d_mat_10000_tsne.bin', dtype=np.float32).reshape((10000,2))
plot_coords = {"dims": 2, "tsneMap": plot_arr.tolist()}
with open('MNIST10000.json', 'w') as f:
    json.dump(plot_coords, f)

```

##### Appendix: Defining choropleths

* Configure the choropleth with a SIMPLE_LOADER or IMAGE_STRIP_LOADER

* Supply the choropleth SVG file(s) either locally or via a remote URL

* Setup which choropleths are to be preloaded

* Define a choropleths properties file as follows (here the ids are sequential but in reality these can be any list of unique strings". SUpply at least an id and color_hex_triplet prop:

```python
import json
props = {"msg":[{"children":[]}]}
props["msg"][0]["children"] = [{"id": str(x), "color_hex_triplet":"101010"} for x in range(784)]
json.dumps(props)
```

* Define which properties are to be shown in the annotation popup.




