"""
=============================================================================
Manifold learning on handwritten digits: Locally Linear Embedding, Isomap...
=============================================================================

An illustration of various embeddings on the digits dataset.

The RandomTreesEmbedding, from the :mod:`sklearn.ensemble` module, is not
technically a manifold embedding method, as it learn a high-dimensional
representation on which we apply a dimensionality reduction method.
However, it is often useful to cast a dataset into a representation in
which the classes are linearly-separable.

t-SNE will be initialized with the embedding that is generated by PCA in
this example, which is not the default setting. It ensures global stability
of the embedding, i.e., the embedding does not depend on random
initialization.
"""

# Authors: Fabian Pedregosa <fabian.pedregosa@inria.fr>
#          Olivier Grisel <olivier.grisel@ensta.org>
#          Mathieu Blondel <mathieu@mblondel.org>
#          Gael Varoquaux
# License: BSD 3 clause (C) INRIA 2011

print(__doc__)
from time import time

import numpy as np
import matplotlib.pyplot as plt
from sklearn import manifold
from skimage import color


X = np.load('/home/bvanlew/data/np10000x784.npy')
A = X/255.0
B = X/255.0
C = np.zeros((784,2))
index = 0
for x in range(28):
    for y in range(28):
        C[index][0] = x
        C[index][1] = y
        index += 1

n_samples, n_features = X.shape
n_neighbors = 30

def indexLabColor(i):
    a = (((i / 28) / 27.0) * 255.0) - 127.0
    b = (((i % 28) / 27.0) * 255.0) - 127.0
    L = 75
    rgb = color.lab2rgb([[[L, a, b]]])
    c = (rgb[0, 0, 0], rgb[0, 0, 1], rgb[0, 0, 2])
    return c

#----------------------------------------------------------------------
# Scale and visualize the embedding vectors
def plot_embedding(X, title=None, indextocolor=False):
    x_min, x_max = np.min(X, 0), np.max(X, 0)
    X = (X - x_min) / (x_max - x_min)

    plt.figure()
    ax = plt.subplot(111)
    for i in range(X.shape[0]):
        c = 'r'
        if indextocolor:
            c = indexLabColor(i)
        plt.scatter(X[i, 0], X[i, 1], c=c, alpha=0.5)


    plt.xticks([]), plt.yticks([])
    if title is not None:
        plt.title(title)



# t-SNE embedding of the digits dataset
#print("Computing t-SNE embedding")
#tsne = manifold.TSNE(n_components=2, init='pca', random_state=0)
#t0 = time()
#X_tsne = tsne.fit_transform(A)

#plot_embedding(X_tsne,
#               "t-SNE embedding of the digits (time %.2fs)" %
#               (time() - t0), False)



# complimentary t-SNE embedding of the digits dataset
print("Computing t-SNE embedding")
tsne = manifold.TSNE(n_components=2, init='pca', random_state=0,  perplexity=30)
t0 = time()

X_tsne_comp = tsne.fit_transform(B.transpose())

plot_embedding(X_tsne_comp,
               "complimentary t-SNE embedding of the digits (time %.2fs)" %
               (time() - t0), True)

t0 = time()
plot_embedding(C,
               "Lab index (time %.2fs)" %
               (time() - t0), True)


plt.show()
