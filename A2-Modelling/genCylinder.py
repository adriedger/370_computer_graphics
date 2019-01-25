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

faces = []

def gen_faces(side):
    
    s_a = 1
    l_a = 1
    s_b = 1+n+1
    l_b = 2

    if side == "bottom":
        for i in range(s_a+1, s_a+n+1):
            faces.append((s_a, i, ((i-l_a)%n)+s_a+1))
    elif side =="top":
        for i in range(s_b+1, s_b+n+1):
            faces.append((s_b, i, ((i-l_b)%n)+s_b+1))
    elif side == "sides":
        for i in range(2, 2+n):
            faces.append((i, i+n+1, ((i-1)%n)+n+3))
            faces.append((i, ((i-1)%n)+n+3, ((i-1)%n)+2))
 
gen_faces("bottom")
gen_faces("top")
gen_faces("sides")

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

