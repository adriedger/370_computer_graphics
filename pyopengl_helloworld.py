from OpenGL.GL import *
from OpenGL.GLUT import *
import sys

def display():
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT)
    glLoadIdentity()

    glutWireTeapot(0.5)

    glutSwapBuffers()

def reshape(width, height):
    glViewport(0, 0, width, height)

def keyboard(key, x, y):
    # space key
    #if key == b' ':
    # escape key
    if key == chr(27).encode():
        sys.exit( )

def idle():
    glutPostRedisplay()

glutInit()

glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGBA | GLUT_DEPTH)
glutCreateWindow('Hello world!')
glutReshapeWindow(1028, 1028)
glutReshapeFunc(reshape)
glutDisplayFunc(display)
glutIdleFunc(idle)
glutKeyboardFunc(keyboard)

glutMainLoop()
