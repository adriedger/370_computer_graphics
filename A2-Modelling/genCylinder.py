# Andre Driedger
# Generates a cylinder obj file with radius 1 and height 2

from math import *

n = 6 #discretizations
vertices = []

def gen_vertices(side):
    if side == "top":
        z = 2
    else:
        z = 0
    vertices.append((0, 0, z))#centerpoint
    dsc = (2*pi)/n 
    for i in range(0, n): #n divisions
        theta = dsc*i
        vertices.append((cos(theta), sin(theta), z))

gen_vertices("bottom")
gen_vertices("top")
#print vertices

faces = []

def gen_faces(side):
    if side == "bottom":
        s = 1
        l = 1
    elif side =="top":
        s = 1+n+1
        l = 2
    for i in range(s+1, s+n+1):
        faces.append((s, i, ((i-l)%n)+s+1))

gen_faces("bottom")
gen_faces("top")

objFile = open("cylinder.obj", "w")
for v in vertices:
    objFile.write("v ")
    for a in v:
        objFile.write(format(a, ".2f") + " ")#output to a precision of 2
    objFile.write("\n")
for f in faces:
    objFile.write("f ")
    for a in f:
        objFile.write(str(a) + " ")
    objFile.write("\n")

