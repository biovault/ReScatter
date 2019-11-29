#!/usr/bin/env python
# The purpose of this script is to import npy files
# containing a single scatter plot array of x,y coordinated and output a
# json file in the correct format for ReScatter

import numpy as np
import json
import argparse
import os

def main():
    parser = argparse.ArgumentParser(description="Convert npy float format coordinate array to json ReScatter raw. Output file extension is .json")
    parser.add_argument("npy", help="A path to a.npy file containing coordinate data - shape is (N, 2) where N is the number of coordinates")
    parser.add_argument('-r', '--raw', action='store_true', help='If the file is raw rather than npy - default is npy')
    parser.add_argument('-t', '--type', type=str, choices=['f32', 'f64'], default='f32', help='Type for raw')
    args = parser.parse_args()

    plotDict = {'dims': 2, 'points': []}
    data  = []
    if not args.raw:
        data = np.load(args.npy)
    else:
        nptypedict = {'f32': np.float32, 'f64': np.float64}
        data = np.fromfile(args.npy, dtype=nptypedict[args.type])
    # automatically reshape single dimensional array (typical atsne output)
    if len(data.shape) == 1 and data.shape[0] % 2 == 0:
        data = data.reshape(int(data.shape[0]/2), 2)

    if len(data.shape) != 2 or data.shape[1] != 2:
        raise ValueError('input data shape must be (N, 2)')
    # cast from np type to the json serializable float type
    for coord in data:
        plotDict['points'].append([float(coord[0]), float(coord[1])])

    root, _ =  os.path.splitext(args.npy)
    with open(root + '.json', 'w') as fp:
        json.dump(plotDict, fp)

if __name__ == "__main__":
    # execute only if run as a script
    main()
