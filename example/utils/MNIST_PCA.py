from sklearn import decomposition
from sklearn import datasets
import numpy as np
import pandas as pd
import nrrd
from pandas.plotting import parallel_coordinates
from pandas.plotting import radviz
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA

np.random.seed(5)
from sklearn.datasets import fetch_mldata
mnist = fetch_mldata('MNIST original', data_home="mldata.org")
print(" Mnist train shape", mnist.data.shape)
x_train = mnist.data[:60000]
y_train = mnist.target[:60000]

# experimentation shows that the first 8 exhibit some distinguishing properties
pca = PCA(svd_solver="randomized", n_components=5)
X = pca.fit_transform(x_train)

Xfloat = X.astype(np.float32)
nrrd.write('MNIST_PCA5_60000.nrrd', Xfloat, options={"encoding":"raw"})

print("PCA shape", X.shape)
columns = ['PCA0', 'PCA1', 'PCA2', 'PCA3', 'PCA4', 'digit']
stackedPCA = np.column_stack((X, y_train))
index = range(60000)
dfPCA = pd.DataFrame(stackedPCA, index=index, columns=columns)
dfPCA_small = dfPCA.sample(200).sort_values(['digit'])

pca2 = PCA(svd_solver="randomized", n_components=6)
X2 = pca2.fit_transform(x_train)
print("PCA2 shape", X2.shape)
columns = ['PCA0', 'PCA1', 'PCA2', 'PCA3', 'PCA4', 'PCA5', 'digit']
stackedPCA2 = np.column_stack((X2, y_train))
index = range(60000)
dfPCA2 = pd.DataFrame(stackedPCA2, index=index, columns=columns)
dfPCA2_small = dfPCA2.sample(200).sort_values(['digit'])

from matplotlib.colors import ListedColormap

alpha = 0.6
cmap = plt.cm.Paired
my_cmap = cmap(np.arange(cmap.N))
my_cmap[:, -1] = np.ones((cmap.N)) * alpha
my_cmap = ListedColormap(my_cmap)

plt.figure()
axpc = parallel_coordinates(dfPCA_small, 'digit', colormap=my_cmap)
plt.figure()
axrv = radviz(dfPCA_small, 'digit', colormap=my_cmap)

plt.show()
