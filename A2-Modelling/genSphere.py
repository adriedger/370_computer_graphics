# Andre Driedger 1805536
# Generates a shere obj file with radius 1 and 32 discretizations

from math import *

n = 32 #vertices along equator
m = 16 #vertices pole to pole
vertices = []

def gen_vertices():

    vertices.append((0, 1, 0)) #north pole
    vertices.append((0, -1, 0)) #south pole
    ele_agl = (pi)/m #180 from top to bottom
    azm_agl = (2*pi)/n #360 counterclockwise from (1, 0, 0)
    for i in range(0, n):
        theta = azm_agl*i
        for j in range(1, m):
            phi = ele_agl*j
            x = cos(theta)*sin(phi)
            y = cos(phi) #cos of the discretized elevation angle
            z = sin(theta)*sin(phi)
            vertices.append((x, y, z))

gen_vertices()
#print vertices
faces = []
'''
def gen_faces(side): #start/end points of each side are key delimiters
    if side == "bottom":
        for i in range(2, 2+n):
            faces.append((1, i, ((i-1)%n)+2))
    elif side =="top":
        for i in range(3+n, 3+n+n):
            faces.append((2+n, i, ((i-2)%n)+n+3))
    elif side == "sides":
        for i in range(2, 2+n):
            faces.append((i, i+n+1, ((i-1)%n)+n+3))
            faces.append((i, ((i-1)%n)+n+3, ((i-1)%n)+2))
 
gen_faces("bottom")
gen_faces("top")
gen_faces("sides")
'''

objFile = open("sphere.obj", "w")
for v in vertices:
    objFile.write("v ")
    for a in v:
        objFile.write(format(a, ".2f") + " ") #output to a precision of 2
    objFile.write("\n")

'''for f in faces:
    objFile.write("f ")
    for a in f:
        objFile.write(str(a) + " ")
    objFile.write("\n")
'''
