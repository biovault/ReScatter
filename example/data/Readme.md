## Downloading the example data

The example data must be placed in this directory for the examples to work.

Because the data comprises large binary files unsuitable for storage in git 
it is stored in a separate location. It can be
downloaded from [a Dropbox share](https://www.dropbox.com/sh/o1njmkwm758ncbq/AACihTi-156x0Cwrqlk2Zz9Ca?dl=0).

e.g.

```shell
cd <repo>\example\data
wget -o exampledata.zip https://www.dropbox.com/sh/o1njmkwm758ncbq/AACihTi-156x0Cwrqlk2Zz9Ca?dl=0 
unzip exampledata.zip
mv example/data/* ./
```

####Data for examples


File | Type | Content
--- | --- | ---
np1000000x784.nrrd | nrrd v5 | 10Kx784 float array of MNIST data scaled to the [0,1] range
np1000000x784.nrrd.gz | nrrd v5 | Compresses version of above - the exampleserver.py will send this as gzipped content
MNIST784.json | json | x,y coords for tsne map of the samples
pixel_label_784.json | json | meta data for the dample points
MNIST10000.json | json | x,y coords for tsne map of the images
digit_label_1000.json | json | meta data for the digit points
