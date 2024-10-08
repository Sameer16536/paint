import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Image, Circle, Line, Arrow, Transformer } from 'react-konva';
import { v4 as uuidv4 } from 'uuid';
import { Box, Button, ButtonGroup, Flex, IconButton, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import { SketchPicker } from 'react-color';
import { PencilFill, Square, Circle as CircleIcon, Search, ArrowUpRight, PaletteFill, CursorFill, Trash, Download, Upload, Plus, Dash, ArrowsFullscreen, ArrowsAngleExpand } from 'react-bootstrap-icons';


const Paint3 = () => {
    const [color, setColor] = useState('#000');
    const [drawAction, setDrawAction] = useState('none');
    const [scribbles, setScribbles] = useState([]);
    const [rectangles, setRectangles] = useState([]);
    const [circles, setCircles] = useState([]);
    const [arrows, setArrows] = useState([]);
    const [image, setImage] = useState(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [zoomMode, setZoomMode] = useState(false);
    const [activeButton, setActiveButton] = useState(null);
    const [dragMode, setDragMode] = useState(false);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const [colorPicker, setColorPicker] = useState(false)
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [shapeDragMode, setShapeDragMode] = useState(false)
    const [resizeMode, setResizeMode] = useState(false)
    const [selectedId, setSelectedId] = useState(null)



    const { isOpen, onOpen, onClose } = useDisclosure();
    const stageRef = useRef(null);
    const fileRef = useRef(null);
    const isPaintRef = useRef(false);
    const currentShapeRef = useRef(null);
    const transformerRef = useRef(null);

    const toggleButton = (action) => {

        if (drawAction === action) {
            setDrawAction('none');
            setActiveButton(null);
        } else {
            setDrawAction(action);
            setActiveButton(action);
        }
    };

    const toggleColorPicker = () => {
        setColorPicker(!colorPicker)
    }


    const onStageMouseDown = useCallback((e) => {
        if (drawAction === 'none' || !activeButton) return;
        isPaintRef.current = true;
        const stage = e.target.getStage();
        const clickedOnImage = e.target === stage.findOne('Image')
        const pointerPos = stage.getPointerPosition();
        const scale = stage.scaleX();

        const stagePos = {
            x: (pointerPos.x - stage.x()) / scale,
            y: (pointerPos.y - stage.y()) / scale
        };

        const id = uuidv4();
        currentShapeRef.current = id;
        //! Handle Image Drag Mode::
        if (dragMode && clickedOnImage) {
            return
        }

        switch (drawAction) {
            case 'scribble':
                setScribbles(prev => [...prev, { id, points: [stagePos.x, stagePos.y], color }]);
                break;
            case 'rectangle':
                setRectangles(prev => [...prev, { id, x: stagePos.x, y: stagePos.y, width: 0, height: 0, color }]);
                break;
            case 'circle':
                setCircles(prev => [...prev, { id, x: stagePos.x, y: stagePos.y, radius: 0, color }]);
                break;
            case 'arrow':
                setArrows(prev => [...prev, { id, points: [stagePos.x, stagePos.y, stagePos.x, stagePos.y], color }]);
                break;
        }
    }, [drawAction, color, activeButton, dragMode]);


    const onStageMouseMove = useCallback(() => {
        if (drawAction === 'none' || !isPaintRef.current) return;
        const stage = stageRef.current;
        const pointerPos = stage.getPointerPosition();
        const scale = stage.scaleX();

        const stagePos = {
            x: (pointerPos.x - stage.x()) / scale,
            y: (pointerPos.y - stage.y()) / scale
        };

        switch (drawAction) {
            case 'scribble':
                setScribbles(prev =>
                    prev.map(scribble =>
                        scribble.id === currentShapeRef.current
                            ? { ...scribble, points: [...scribble.points, stagePos.x, stagePos.y] }
                            : scribble
                    )
                );
                break;
            case 'rectangle':
                setRectangles(prev =>
                    prev.map(rect =>
                        rect.id === currentShapeRef.current
                            ? { ...rect, width: stagePos.x - rect.x, height: stagePos.y - rect.y }
                            : rect
                    )
                );
                break;
            case 'circle':
                setCircles(prev =>
                    prev.map(circle =>
                        circle.id === currentShapeRef.current
                            ? { ...circle, radius: Math.sqrt(Math.pow(stagePos.x - circle.x, 2) + Math.pow(stagePos.y - circle.y, 2)) }
                            : circle
                    )
                );
                break;
            case 'arrow':
                setArrows(prev =>
                    prev.map(arrow =>
                        arrow.id === currentShapeRef.current
                            ? { ...arrow, points: [arrow.points[0], arrow.points[1], stagePos.x, stagePos.y] }
                            : arrow
                    )
                );
                break;
        }
    }, [drawAction]);



    const onStageMouseUp = useCallback(() => {
        isPaintRef.current = false;

        if (drawAction === 'rectangle' && rectangles.length > 0) {
            const lastRectangle = rectangles[rectangles.length - 1];

            if (lastRectangle.width !== 0 && lastRectangle.height !== 0) {
                console.log("Rectangle Coordinates:", {
                    x: lastRectangle.x,
                    y: lastRectangle.y,
                    width: lastRectangle.width,
                    height: lastRectangle.height,
                    zoom: zoomLevel,
                    scale: stageRef.current.scaleX()
                });
            }
        }
    }, [drawAction, rectangles]);

    const onShapeClick = useCallback((e) => {
        // if (drawAction !== 'select') return;
        //! Here might be the issue
        if (!resizeMode) return
        const currentTarget = e.currentTarget;
        setSelectedId(currentTarget.id())
        transformerRef.current.nodes([currentTarget]);
        transformerRef.current.getLayer().batchDraw();
    }, [drawAction, resizeMode]);

    const checkDeselect = useCallback((e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            transformerRef.current.nodes([]);
        }
    }, []);

    //!Issue
    const handleTransformEnd = useCallback((e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset the scale
        node.scaleX(1);
        node.scaleY(1);

        if (selectedId === 'image') {
            const image = node;
                
            // *Update image size based on the transformer scale
            const newWidth = image.width() * scaleX;
            const newHeight = image.height() * scaleY;

            // *Create a new image object for updated dimensions
            const newImage = new window.Image();
            newImage.src = image.image().src; 
            newImage.onload = () => {
                image.image(newImage);
                image.width(newWidth);
                image.height(newHeight);
                image.getLayer().batchDraw(); 
            };
        } else {
            // Update rectangles
            setRectangles(rects =>
                rects.map(rect => {
                    if (rect.id === selectedId) {
                        return {
                            ...rect,
                            x: node.x(),
                            y: node.y(),
                            width: Math.abs(node.width() * scaleX),
                            height: Math.abs(node.height() * scaleY),
                        };
                    }
                    return rect;
                })
            );

            // Update circles
            setCircles(circs =>
                circs.map(circ => {
                    if (circ.id === selectedId) {
                        return {
                            ...circ,
                            x: node.x(),
                            y: node.y(),
                            radius: Math.abs(node.width() * scaleX / 2),
                        };
                    }
                    return circ;
                })
            );

            // Update arrows
            setArrows(arrs =>
                arrs.map(arr => {
                    if (arr.id === selectedId) {
                        const oldPoints = arr.points;
                        const newPoints = [
                            node.x(),
                            node.y(),
                            node.x() + (oldPoints[2] - oldPoints[0]) * scaleX,
                            node.y() + (oldPoints[3] - oldPoints[1]) * scaleY,
                        ];
                        return { ...arr, points: newPoints };
                    }
                    return arr;
                })
            );
        }
    }, [selectedId, image])

    useEffect(() => {
        if (selectedId === null) {
            return;
        }
        const stage = stageRef.current;
        const layer = stage.findOne('Layer');
        let node;
        if (selectedId === 'image') {
            node = layer.findOne('Image');
        } else {
            node = layer.findOne(`#${selectedId}`);
        }
        if (node) {
            transformerRef.current.nodes([node]);
            layer.batchDraw();
        }
    }, [selectedId]);

    const handleImageUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const imageURL = URL.createObjectURL(file);
            const img = new window.Image();
            img.src = imageURL;
            img.onload = () => {
                setImage(img);
                URL.revokeObjectURL(imageURL);
            };
            img.onerror = () => {
                console.error('Error loading image');
                URL.revokeObjectURL(imageURL);
            };
        }
    };
    useEffect(() => {
        if (image) {
            const newImage = new window.Image();
            newImage.src = image.src; // Ensure image source is correctly set
            newImage.onload = () => {
                setImage(newImage);
            };
        }
    }, [image]);
    

    const onExportClick = useCallback(() => {
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 3 });
        const link = document.createElement('a');
        link.download = 'paint-export.png';
        link.href = dataURL;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, []);

    const onClear = useCallback(() => {
        setScribbles([]);
        setRectangles([]);
        setCircles([]);
        setArrows([]);
        setImage(null);
    }, []);

    const handleZoomIn = () => {
        const stage = stageRef.current;
        const newZoom = Math.min(zoomLevel * 1.2, 5);
        setZoomLevel(newZoom);
        stage.scale({ x: newZoom, y: newZoom });
        stage.batchDraw();
    };

    const handleZoomOut = () => {
        const stage = stageRef.current;
        const newZoom = Math.max(zoomLevel / 1.2, 1);
        setZoomLevel(newZoom);
        stage.scale({ x: newZoom, y: newZoom });
        if (newZoom === 1) {
            stage.position({ x: 0, y: 0 });
        }
        stage.batchDraw();
    };

    const handleResetZoom = () => {
        const stage = stageRef.current;
        setZoomLevel(1);
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.batchDraw();
    };

    const handleWheel = useCallback((e) => {
        if (!zoomMode) return;
        e.evt.preventDefault();

        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
        const newZoomLevel = Math.max(1, Math.min(newScale, 5));

        setZoomLevel(newZoomLevel);
        stage.scale({ x: newZoomLevel, y: newZoomLevel });

        const newPos = {
            x: pointer.x - mousePointTo.x * newZoomLevel,
            y: pointer.y - mousePointTo.y * newZoomLevel,
        };
        stage.position(newPos);
        stage.batchDraw();
    }, [zoomMode]);

    useEffect(() => {
        const stage = stageRef.current;
        if (zoomLevel === 1) {
            stage.position({ x: 0, y: 0 });
            stage.batchDraw();
        }
    }, [zoomLevel]);

    const handleStageClick = useCallback((e) => {
        if (e.target === e.target.getStage()) {
            setSelectedId(null);
            transformerRef.current.nodes([]);
        }

        if (!zoomMode) return;

        if (e.evt.type === 'click') {

            const stage = stageRef.current;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const newScale = e.evt.ctrlKey ? oldScale / 1.2 : oldScale * 1.2;
            const newZoomLevel = Math.max(1, Math.min(newScale, 5));

            setZoomLevel(newZoomLevel);
            stage.scale({ x: newZoomLevel, y: newZoomLevel });

            const newPos = {
                x: pointer.x - mousePointTo.x * newZoomLevel,
                y: pointer.y - mousePointTo.y * newZoomLevel,
            };
            stage.position(newPos);
            stage.batchDraw();
        }
    }, [zoomMode, resizeMode]);
    const handleColorChange = (newColor) => {
        setColor(newColor.hex);
    };
    //!Remove
    // useEffect(() => {
    //     console.log('Image state updated:', image);
    // }, [image]);
    return (
        <>
            <Box bg='gray.300' w='100%' h='80vh' overflow='hidden' position='relative'>
                <Stage
                    width={window.innerWidth}
                    height={window.innerHeight * 0.8}
                    onMouseDown={onStageMouseDown}
                    onMouseMove={onStageMouseMove}
                    onMouseUp={onStageMouseUp}
                    ref={stageRef}
                    onClick={handleStageClick}
                    onWheel={handleWheel}
                    style={{ cursor: dragMode ? 'move' : (shapeDragMode ? 'grab' : 'default') }}
                >
                    <Layer>
                        {image && (
                            <Image
                                image={image}
                                width={image ? image.width : 0}
                                height={image ? image.height : 0}
                                draggable={dragMode}
                                onDragEnd={(e) => {
                                    if (dragMode) {
                                        setImagePosition({ x: e.target.x(), y: e.target.y() });
                                    }
                                }}
                                onClick={() => {
                                    if (resizeMode) {
                                        setSelectedId('image');
                                    }
                                }}
                                onTransformEnd={(e) => { handleTransformEnd(e) }}
                            />
                        )}
                    </Layer>
                    <Layer>
                        {scribbles.map(scribble => (
                            <Line
                                key={scribble.id}
                                points={scribble.points}
                                stroke={scribble.color}
                                strokeWidth={3}
                                tension={0.5}
                                lineCap='round'
                                draggable={shapeDragMode}
                                onDragEnd={(e) => {
                                    if (shapeDragMode) {
                                        const pos = e.target.position();
                                        setScribbles(prev => prev.map(s => s.id === scribble.id ? { ...s, points: s.points.map((p, i) => i % 2 === 0 ? p + pos.x : p + pos.y) } : s));
                                    }
                                }}
                            />
                        ))}
                        {rectangles.map((rect) => (
                            <Rect
                                key={rect.id}
                                id={rect.id}
                                x={rect.x}
                                y={rect.y}
                                width={rect.width}
                                height={rect.height}
                                fill="transparent"
                                stroke={rect.color}
                                strokeWidth={2}
                                onClick={onShapeClick}
                                draggable={shapeDragMode}
                                onDragEnd={(e) => {
                                    if (shapeDragMode) {
                                        const pos = e.target.position();
                                        setRectangles(prev => prev.map(r => r.id === rect.id ? { ...r, x: pos.x, y: pos.y } : r));
                                    }

                                }}
                                onTransformEnd={(e) => { handleTransformEnd(e) }}

                            />
                        ))}
                        {circles.map((circle) => (
                            <Circle
                                key={circle.id}
                                id={circle.id}
                                x={circle.x}
                                y={circle.y}
                                radius={circle.radius}
                                fill="transparent"
                                stroke={circle.color}
                                strokeWidth={2}
                                onClick={onShapeClick}
                                draggable={shapeDragMode}
                                onDragEnd={(e) => {
                                    if (shapeDragMode) {
                                        const pos = e.target.position();
                                        setCircles(prev => prev.map(c => c.id === circle.id ? { ...c, x: pos.x, y: pos.y } : c));
                                    }
                                }}
                                onTransformEnd={(e) => { handleTransformEnd(e) }}
                            />
                        ))}
                        {arrows.map((arrow) => (
                            <Arrow
                                key={arrow.id}
                                id={arrow.id}
                                points={arrow.points}
                                fill="transparent"
                                stroke={arrow.color}
                                strokeWidth={2}
                                onClick={onShapeClick}
                                draggable={shapeDragMode}
                                onDragEnd={(e) => {
                                    if (shapeDragMode) {
                                        const pos = e.target.position();
                                        setArrows(prev => prev.map(a => a.id === arrow.id ? { ...a, points: a.points.map((p, i) => i % 2 === 0 ? p + pos.x : p + pos.y) } : a));
                                    }
                                }}
                                onTransformEnd={(e) => { handleTransformEnd(e) }}
                            />
                        ))}
                        <Transformer ref={transformerRef} boundBoxFunc={(oldBox, newBox) => {
                            // // Limit resize
                            // if (newBox.width < 5 || newBox.height < 5) {
                            //     return oldBox;
                            // }
                            return newBox;
                        }} />
                    </Layer>
                </Stage>
            </Box>
            <Flex mt={2} justify='center' align='center'>
                <ButtonGroup>
                    <IconButton icon={<CursorFill />} onClick={() => setShapeDragMode(!shapeDragMode)} colorScheme={shapeDragMode ? 'blue' : 'gray'}
                        aria-label='Shape Drag Mode'
                    />
                    <IconButton icon={<PencilFill />} aria-label='Scribble' bg={activeButton === 'scribble' ? 'green.400' : 'gray.200'} onClick={() => toggleButton('scribble')} />
                    <IconButton
                        icon={<PaletteFill />}
                        aria-label='Color Picker'
                        onClick={toggleColorPicker}
                    />
                    <IconButton icon={<Square />} aria-label='Rectangle' bg={activeButton === 'rectangle' ? 'green.400' : 'gray.200'} onClick={() => toggleButton('rectangle')} />
                    <IconButton icon={<CircleIcon />} aria-label='Circle' bg={activeButton === 'circle' ? 'green.400' : 'gray.200'} onClick={() => toggleButton('circle')} />
                    <IconButton icon={<ArrowUpRight />} aria-label='Arrow' bg={activeButton === 'arrow' ? 'green.400' : 'gray.200'} onClick={() => toggleButton('arrow')} />
                    <IconButton
                        icon={<CursorFill />}
                        onClick={() => setDragMode(!dragMode)}
                        colorScheme={dragMode ? 'green' : 'gray'}
                    />
                    <IconButton icon={<Trash />} aria-label='Clear' bg='red.400' onClick={onClear} />
                </ButtonGroup>
                <IconButton icon={<Upload />} aria-label='Upload Image' onClick={onOpen} />
                <IconButton icon={<Download />} aria-label='Export Image' onClick={onExportClick} />
                <IconButton icon={<Search />} aria-label='Zoom' bg={zoomMode ? 'green.400' : 'gray.200'} onClick={() => setZoomMode(!zoomMode)} />
                <ButtonGroup>
                    <IconButton icon={<Plus />} aria-label='Zoom In' onClick={handleZoomIn} />
                    <IconButton icon={<Dash />} aria-label='Zoom Out' onClick={handleZoomOut} />
                    <IconButton icon={<ArrowsFullscreen />} aria-label='Reset Zoom' onClick={handleResetZoom} />
                    <IconButton
                        icon={<ArrowsAngleExpand />}
                        onClick={() => {
                            setResizeMode(!resizeMode)
                            setDrawAction('none')
                            setActiveButton(null)
                            //!remove this
                            console.log("Resize mode:", !resizeMode)

                        }
                        }

                        colorScheme={resizeMode ? 'purple' : 'gray'}
                        aria-label='Resize Mode'
                    />
                </ButtonGroup>
            </Flex>
            {colorPicker && (
                <Box position="absolute" zIndex={1}>
                    <SketchPicker
                        color={color}
                        onChange={handleColorChange}
                    />
                </Box>
            )}

            <Modal isOpen={isOpen} onClose={onClose}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Upload Image</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} />
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
};

export default Paint3;