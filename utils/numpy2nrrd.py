#!/usr/bin/env python
# The purpose of this script is to import npy files
# containing a single float (32 or 64) array and output 32 float nrrd files
# 32 bit float NRRD is the format used by ReScatter for handling large data

import numpy as np
import nrrd
import argparse
import os

def main():
    parser = argparse.ArgumentParser(description='Convert npy float format to nrrd 32 float raw. Output file extension is .nrrd')
    parser.add_argument('npy', help='A path to an npy (or raw) file containing float data')
    parser.add_argument('-r', '--raw', action='store_true', help='If the file is raw rather than npy - default is npy')
    args = parser.parse_args()

    data  = []
    if not args.raw:
        data = np.load(args.npy)
    else:
        data = np.fromfile(args.npy)
    root, _ = os.path.splitext(args.npy)
    nrrd.write(root + '.nrrd', data.astype(np.float32), {u'encoding': u'raw'})

if __name__ == "__main__":
    # execute only if run as a script
    main()
