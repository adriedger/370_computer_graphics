# Andre Driedger

# Generates a cylinder obj file with radius 1 and height 2

from math import *

n = 8 #discretizations
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

objFile = open("cylinder.obj", "w")
for v in vertices:
    objFile.write("v ")
    for a in v:
        objFile.write(format(a, ".2f") + " ")#output to a precision of 2
    objFile.write("\n")
    


