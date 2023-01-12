class ModelViewer3D {
    constructor(eleId) {
        this.viewer = document.getElementById(eleId);
        this.viewerWidth = this.viewer.clientWidth;
        this.viewerHeight = this.viewer.clientHeight;
        this.scene = new THREE.Scene(); //Init 3D Scene
        this.scene.background = new THREE.Color(0x333333); //Set Scene BackgroundColor
        this.loadSceneBackground(); //Load Scene Background
        this.loadCamera(); //Load Camera Perspective
        this.loadRenderer(); //Load Renderer
        this.loadOrbitController(); //Load OrbitController
        this.loadLight(); //Load Light
        this.clock = new THREE.Clock();
        this.animate(); //Animate Scene

        this.textureLoader = new THREE.TextureLoader();
        this.metallicTexture = this.textureLoader.load("./assets/models/gears/gear1/model_texture.jpg");
        this.metallicTexture.encoding = THREE.sRGBEncoding;
        this.metallicTexture.flipY = false;
        this.metallicTexture.wrapS = THREE.RepeatWrapping;
        this.metallicTexture.wrapT = THREE.RepeatWrapping;
        this.gltfLoader = new THREE.GLTFLoader();
        this.lablesONMode = false;
        this.wireFrameMode = false;
        this.modelObjAnimations = [];
        this.currentViewMode = "view360";
        this.modelFrom = "labelsonoff";
        this.modelsInScene = [];
    }

    loadSceneBackground() {
        this.sceneBackground = new THREE.CubeTextureLoader()
            .setPath("./assets/models/reflections/")
            .load(["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"]);
    }

    loadCamera() {
        this.camera = new THREE.PerspectiveCamera(25, this.viewerWidth / this.viewerHeight, 1, 20000);
        this.camera.position.set(1, 1, 500);
    }

    loadRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        this.renderer.setClearColor(0xc5c5c3);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(this.viewerWidth, this.viewerHeight);
        this.viewer.appendChild(this.renderer.domElement);
    }

    loadOrbitController() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enablePan = false;
        // this.controls.minDistance = 400;
        // this.controls.maxDistance = 600;
    }

    loadLight() {
        var ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff);
        directionalLight.position.set(0, 1, 1).normalize();
        this.scene.add(directionalLight);

        var pointLight1 = new THREE.PointLight(0xc4c4c4);
        pointLight1.position.set(0, 300, 500);
        this.scene.add(pointLight1);
        var pointLight2 = new THREE.PointLight(0xc4c4c4);
        pointLight2.position.set(500, 100, 0);
        this.scene.add(pointLight2);
        var pointLight3 = new THREE.PointLight(0xc4c4c4);
        pointLight3.position.set(0, 100, -500);
        this.scene.add(pointLight3);
        var pointLight4 = new THREE.PointLight(0xc4c4c4);
        pointLight4.position.set(-500, 300, 0);
        this.scene.add(pointLight4);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
        if (this.animationMixer) {
            this.animationMixer.update(this.clock.getDelta());
        }
    }

    animate() {
        this.render();
        if (this.model3dObj) {
            //this.model3dObj.rotation.y += 0.005;
        }
        requestAnimationFrame(this.animate.bind(this));
    }

    getModelName() {
        switch (this.modelFrom) {
            case "view360":
                return "model_label";
            case "explode":
                return "model_anim";
            case "cutsection":
                return "model_cs_label";
            case "labelsonoff":
                return "model_label";
            case "cslabelsonoff":
                return "model_cs_label";
            default:
                return false;
        }
    }

    load3DModel() {
        var nextModel3dObj = this.scene.getObjectByName(this.modelFrom);
        if (nextModel3dObj) {
            this.model3dObj.visible = false;
            if (this.modelObjAnimations[this.model3dObj.name]) {
                let animationAction = this.modelObjAnimations[this.model3dObj.name];
                animationAction.time = 0;
                animationAction.setLoop(THREE.LoopOnce);
            }
            this.model3dObj = nextModel3dObj;
            this.setLabelsOnOff();
            if (this.modelObjAnimations[this.modelFrom]) {
                let animationAction = this.modelObjAnimations[this.modelFrom];
                animationAction.time = 0;
                animationAction.setLoop(THREE.LoopOnce);
                animationAction.paused = false;
                animationAction.play();
            }
            this.wireFrameMode = true;
            this.toggleWireFrameMode();
            this.model3dObj.visible = true;
            return;
        }
        this._precall && this._precall();

        var modelName = this.getModelName();
        if (modelName) {
            var path = `./assets/models/gears/${this.selectModelId}/${modelName}.glb`;
            this.gltfLoader.load(path, this.onLoaderLoaded.bind(this), this.onLoaderProgress.bind(this), this.onLoaderError.bind(this));
        }
    }

    onLoaderLoaded(gltf) {
        gltf.scene.scale.set(100, 100, 100);
        gltf.scene.position.x = 0;
        gltf.scene.position.y = 0;
        gltf.scene.position.z = 0;
        gltf.scene.name = this.modelFrom;

        if (gltf.animations.length) {
            this.animationMixer = new THREE.AnimationMixer(gltf.scene);
            var action = this.animationMixer.clipAction(gltf.animations[0]);
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
            action.play();
            this.modelObjAnimations[this.modelFrom] = action;
        }

        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            envMap: this.sceneBackground,
            skinning: true,
        });

        gltf.scene.traverse((o) => {
            if (o.isMesh) {
                if (o.parent.name == "lable_grp") {
                    return;
                }
                o.material = material;
                o.material.map = this.metallicTexture;
                o.material.needsUpdate = true;
            }
        });

        if (this.model3dObj) {
            this.model3dObj.visible = false;
        }
        this.model3dObj = gltf.scene;
        this.setLabelsOnOff();
        // if (this.wireFrameMode && this.currentViewMode == "wireframe") {
        //     this.wireFrameMode = false;
        //     this.toggleWireFrameMode();
        // }
        //this.wireFrameMode = false;

        this.scene.add(this.model3dObj);
        this.modelsInScene.push(this.model3dObj.name);
        this._postcall && this._postcall();
    }

    onLoaderProgress(progress) {
        var progressPercent = `${parseInt((progress.loaded * 100) / progress.total)}%`;
    }

    onLoaderError(error) {
        this._postcall && this._postcall();
    }

    remove3DModel() {
        for (var i = 0; i < this.modelsInScene.length; i++) {
            this.scene.remove(this.scene.getObjectByName(this.modelsInScene[i]));
        }
    }

    setLabelsOnOff() {
        let lableGroup = this.model3dObj.children.find((o) => o.name == "lable_grp");
        if (lableGroup) {
            lableGroup.visible = this.lablesONMode;
        }
    }

    toggleWireFrameMode() {
        var material;
        if (this.wireFrameMode) {
            material = new THREE.MeshBasicMaterial({
                color: 0xffffff,
                envMap: this.sceneBackground,
                skinning: true,
                map: this.metallicTexture,
            });
        } else {
            material = new THREE.MeshBasicMaterial({
                skinning: true,
                opacity: 0.5,
                transparent: true,
                wireframe: true,
                color: 0xaaaaaa,
            });
        }

        this.model3dObj.traverse((o) => {
            if (o.isMesh) {
                if (o.parent.name == "lable_grp") {
                    return;
                }
                o.material = material;
                o.material.needsUpdate = true;
            }
        });
        this.wireFrameMode = !this.wireFrameMode;
    }

    selectModel(modelId, _precall, _postcall) {
        this.selectModelId = modelId;
        this._precall = _precall;
        this._postcall = _postcall;

        this.remove3DModel();
        this.load3DModel();
    }

    changeViewMode(viewMode) {
        var prevViewMode = this.currentViewMode;
        this.currentViewMode = viewMode;
        switch (viewMode) {
            case "view360":
                this.modelFrom = "labelsonoff";
                this.lablesONMode = false;
                this.load3DModel();
                break;
            case "explode":
                this.modelFrom = viewMode;
                this.load3DModel();
                break;
            case "cutsection":
                this.modelFrom = "cslabelsonoff";
                this.lablesONMode = false;
                this.load3DModel();
                break;
            case "labelsonoff":
                this.wireFrameMode && this.toggleWireFrameMode();
                if (this.currentViewMode == prevViewMode) {
                    this.lablesONMode = !this.lablesONMode;
                    this.setLabelsOnOff();
                } else if (prevViewMode == "explode") {
                    this.modelFrom = "labelsonoff";
                    this.lablesONMode = true;
                    this.load3DModel();
                } else {
                    this.lablesONMode = true;
                    this.setLabelsOnOff();
                }
                break;
            case "wireframe":
                this.lablesONMode = false;
                this.setLabelsOnOff();
                if (prevViewMode != "wireframe") {
                    this.wireFrameMode = false;
                }
                this.toggleWireFrameMode();
                break;
            default:
                return;
        }
    }
}

var modelViewerObj1 = new ModelViewer3D("ModelViewer");

$("#ContentWrapper .leftsection .headerlinks .nav-item").on("click", function (event) {
    var navItemEle = $(event.currentTarget);
    navItemEle.siblings().find(".nav-link").removeClass("active");
    navItemEle.find(".nav-link").addClass("active");

    var action = navItemEle.attr("action");
    modelViewerObj1.changeViewMode(action);
});

$("#ContentWrapper .rightsection input[name='selectmodel']").on("change", function (event) {
    var modelId = event.currentTarget.value;
    modelViewerObj1.selectModel(modelId, preLoadTask, postLoadTask);
});

function preLoadTask() {
    $("#ContentWrapper .leftsection .modelspinner").show();
}
function postLoadTask() {
    $("#ContentWrapper .leftsection .modelspinner").hide();
}

$("#ContentWrapper .rightsection input[name='selectmodel']:checked").trigger("change");
