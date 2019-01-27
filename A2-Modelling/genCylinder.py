# Andre Driedger 1805536
# Generates a cylinder obj file with radius 1 and height 2

from math import *

n = 12 #discretizations
vertices = []

def gen_vertices(side):

    if side == "top":
        z = 2
    else:
        z = 0
    vertices.append((0, 0, z)) #centerpoint
    dsc = (2*pi)/n 
    for i in range(0, n): #n divisions
        theta = dsc*i
        vertices.append((cos(theta), sin(theta), z))

gen_vertices("bottom")
gen_vertices("top")

faces = []
normals = []

def gen_faces_normals(): #start/end points of each side are key delimiters

    #bottom
    for i in range(2, 2+n):
        a = 1
        b = i
        c = ((i-1)%n)+2
        faces.append((a, b, c))
    #top
    for i in range(3+n, 3+n+n):
        a = 2+n
        b = i
        c = ((i-2)%n)+n+3
        faces.append((a, b, c))
    #sides
    for i in range(2, 2+n):
        a = i
        b = i+n+1
        c = ((i-1)%n)+n+3
        d = ((i-1)%n)+2
        faces.append((a, b, c))
        faces.append((a, c, d))
 
gen_faces_normals()

objFile = open("cylinder.obj", "w")
for v in vertices:
    objFile.write("v ")
    for a in v:
        objFile.write(format(a, ".2f") + " ") #output to a precision of 2
    objFile.write("\n")
for f in faces:
    objFile.write("f ")
    for a in f:
        objFile.write(str(a) + " ")
    objFile.write("\n")

