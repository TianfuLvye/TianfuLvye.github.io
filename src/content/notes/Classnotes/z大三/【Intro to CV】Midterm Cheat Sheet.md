

# Lecture 1 Overview — Cheat Sheet

  

#### 1. Course / CV 的核心观点

  

- Computer Vision 不是简单学习 CNN / Transformer / Diffusion 等工具，而是研究 **如何从视觉信号中恢复、理解和利用外部世界信息**。

- 课程覆盖：

- classic vision：image formation, camera model, geometry, features, optimization；

- deep vision：CNN, neural networks, modern vision models；

- applications：segmentation, 3 D vision, embodied AI 等。

- 老师强调：未来单纯“会跑代码 / 会调模型”价值下降，重要的是理解背后的 **scientific principles**，能判断系统失败的原因。

  

---

  

#### 2. Vision ≠ Camera / Eyes

  

**Human visual system includes:**

  

- eyes / sensory organ；

- retina layers；

- optic nerve；

- optic tract；

- visual cortex。

  

**Visual pathway:**

  

> visual field → retina → optic nerve → optic tract → visual cortex

  

重点理解：

  

- eyes / cameras 只是 **sensors**；

- vision 还需要后续的 perception / interpretation；

- camera can capture images, but has no perceptual capability by itself；

- 所以：

**Vision ≠ eyes ≠ camera.**

  

---

  

#### 3. 为什么 Vision 重要？

  

- 人类外部信息大约 **83% comes from vision**，约 11% from audio，其余来自 smell / touch / taste。

- 视觉是 **dense, high-dimensional modality**：

- audio 常可视作 1 D temporal signal；

- image 至少是 2 D dense signal；

- binocular / depth / motion 进一步带来 3 D / spatiotemporal information。

- 视觉包含丰富信息：

- color / texture / edge；

- object / scene；

- geometry / depth；

- motion；

- relation；

- action / intention / prediction。

  

---

  

#### 4. Visual System 的三类任务

  

课件将视觉任务分为：

  

##### A. Visual Sensation

  

低层传感与信号形成：

  

- reception of light；

- formation of monocular neural representations；

- color vision；

- stereopsis；

- assessment of distance。

  

关键词：

  

- monocular vision：单目成像，本质上是 2 D projection；

- binocular vision：双目视觉；

- stereopsis：通过双目视差获得立体感 / 深度感；

- disparity：同一个 3 D 点在左右眼 / 左右相机中的投影位置差异。

  

**Depth 与 disparity：**

  

> near object → large disparity

> far object → small disparity

  

所以双目能通过 disparity 推断 depth。

  

---

  

##### B. Visual Perception

  

定义：

  

> Visual perception is the process of acquiring knowledge about environmental objects and events by extracting information from the light they emit or reflect.

  

中文：

  

> 视觉感知是从物体发出或反射的光中提取信息，从而获得关于环境中物体和事件的知识的过程。

  

重点：

  

- visual perception concerns **acquisition of knowledge**；

- it is fundamentally a **cognitive activity**；

- different from purely optical / photographic processes；

- camera has no perception by itself。

  

---

  

##### C. Visual Motor Coordination

  

视觉指导行动：

  

- eye-hand coordination；

- eye-muscle coordination；

- visually guided action；

- perception-action loop。

  

与 embodied AI / robotics 相关：

  

> CV provides perception for embodied agents and plays an important role in the perception-action loop.

  

---

  

#### 5. 从一张图片中能理解什么？Low-level → High-level

  

对于一张图像，计算机看到的是：

  

> H × W × C tensor / pixel grid

  

但人类视觉可以逐层理解：

  

| Level        | Examples                                       |
| ------------ | ---------------------------------------------- |
| low-level    | brightness, color, gradient, edge, texture     |
| mid-level    | contour, region, shape, local structure        |
| high-level   | object category, scene, semantic meaning       |
| higher-level | relation, action, intention, future prediction |

  

老师举例：一张北大校门图片中，人不仅能看到像素，还能识别校门、树、街道、行人、骑车的人、拍照的人，并推断谁在运动、谁静止、接下来可能发生什么。

  

---

  

#### 6. Computer Vision 的 sensors 可以超过人眼

  

CV systems 不限于 RGB camera，可以使用：

  

- RGB camera；

- stereo camera；

- depth camera；

- infrared / thermal camera；

- LiDAR；

- event camera；

- multi-view camera systems。

  

重点判断：

  

> The sensing part of CV systems can leverage many different sensors beyond human eyes.

> True.

  

机器可以在 sensing、data scale、computation 上超过人类视觉系统。

  

---

  

#### 7. CV 与 Embodied AI

  

- 视觉是机器人理解外部世界的重要输入。

- Embodied agents 需要先感知 objects / geometry / motion / affordance，再执行 action。

- 因此 CV 是 embodied intelligence 的重要基础。

- 关键词：

**visual input → perception → decision/action → environment feedback**

  

---

  

#### 8. 容易考的 True / False

  

1. Vision is equivalent to camera image formation.

**False.** Camera only senses; vision requires perception.

  

2. Human visual system only consists of eyes.

**False.** It also includes retina, optic nerve, optic tract, visual cortex.

  

3. Visual perception is a cognitive process.

**True.**

  

4. A camera has perceptual capability by itself.

**False.**

  

5. Binocular vision can provide depth through disparity.

**True.**

  

6. Near objects usually produce smaller disparity than far objects.

**False.** Near objects produce larger disparity.

  

7. CV systems can use sensors beyond RGB cameras.

**True.**

  

8. CV can support embodied agents in perception-action loops.

**True.**

  

9. Deblur is typically the most powerful / highest-level CV task.

**False.** It is usually low-level image restoration.

  

10. 3 D geometric reconstruction is usually a typical high-level semantic understanding task.

**False / not typical.** It is more geometry / reconstruction oriented, not semantic understanding.

  

---

  

#### 9. 标准答题模板

  

##### Q: Why is vision not equal to camera?

  

> A camera only captures visual signals, while vision requires perception and interpretation. Human vision includes eyes, retina, optic nerve, optic tract and visual cortex. Similarly, computer vision requires both sensors and algorithms/models to extract geometry, semantics and actions from visual data.

  

##### Q: What is visual perception?

  

> Visual perception is the process of acquiring knowledge about environmental objects and events by extracting information from the light they emit or reflect. It is a cognitive activity rather than a purely optical process.

  

##### Q: Why can binocular vision estimate depth?

  

> A 3 D point projects to different positions in the two eyes/cameras. The displacement between the two projections is called disparity. Since disparity is related to depth, binocular systems can infer distance through stereopsis.

  

##### Q: Why is computer vision important for embodied AI?

  

> Vision provides dense and high-dimensional information about the environment. Embodied agents need to perceive objects, geometry, motion and affordances before acting, so computer vision is essential for the perception-action loop.

  

---

  

这一讲放到 cheat sheet 上建议压缩成 **半栏以内**。最值得保留的是：

  

**Vision ≠ Camera；Visual sensation / perception / motor coordination；disparity-depth；CV sensors beyond human eye；CV for embodied AI。**


# CV Midterm Cheat Sheet：Lecture 2 & 3 经典视觉

## 1. 图像表示 Image as Function

灰度图：

$$

I=f(x,y),\quad I\in \mathbb{R}^{H\times W}

$$

RGB 图：

$$

I\in \mathbb{R}^{H\times W\times 3}

$$

数字图像是离散的：

- 空间离散：pixel grid；
- 强度离散：如 8-bit，取值 $[0,255]$。

**重点：** 数字图像不能直接精确求连续导数，实际用有限差分 finite difference。

---

## 2. 图像梯度 Image Gradient

$$

\nabla I=
\begin{bmatrix}
I_x\\
I_y
\end{bmatrix}
=
\begin{bmatrix}
\frac{\partial I}{\partial x}\\
\frac{\partial I}{\partial y}
\end{bmatrix}

$$

梯度幅值：

$$

\|\nabla I\|=\sqrt{I_x^2+I_y^2}

$$

梯度方向：

$$

\theta=\arctan\frac{I_y}{I_x}

$$

中心差分：

$$

I_x(x,y)\approx \frac{I(x+1,y)-I(x-1,y)}{2}

$$

$$

I_y(x,y)\approx \frac{I(x,y+1)-I(x,y-1)}{2}

$$

**记忆点：**

- 梯度方向 = intensity 增长最快方向；
- 边缘方向通常与梯度方向垂直；
- 边缘是 intensity 变化剧烈处，不是像素值大的地方。

---

## 3. Filtering / Convolution / Correlation

Filtering：新图像每个 pixel 是原图局部 pixel 的组合。

1 D convolution：

$$

h[n]=(f*g)[n]=\sum_m f[m]g[n-m]

$$

2 D convolution：

$$

(f*g)(i,j)=\sum_m\sum_n f(i-m,j-n)g(m,n)

$$

**Convolution vs Correlation**

- Convolution：kernel 先 flip，再滑动；
- Correlation：kernel 不 flip，直接滑动；
- 深度学习里很多 “conv” 实际实现是 cross-correlation。

**易错：** 卷积会 flip kernel，correlation 不 flip。

---

## 4. Low-pass Filter / Smoothing

卷积定理：

$$

\mathcal{F}(f*g)=\mathcal{F}(f)\mathcal{F}(g)

$$

Moving average 是 low-pass filter。

Low-pass filter：

- 抑制高频；
- 可减少噪声；
- 但会模糊边缘 / 造成 distortion。

Gaussian smoothing：

$$

G_\sigma(x,y)=\frac{1}{2\pi\sigma^2}e^{-\frac{x^2+y^2}{2\sigma^2}}

$$

$\sigma$ 越大，平滑越强。

**易错：**

- noise 通常是 high-frequency；
- sharp edge 也是 high-frequency；
- smoothing 可降噪，但不能完美保边；
- window 越大，平滑越强，但边缘越容易模糊。

---

## 5. Padding / 输出尺寸 / 参数量

卷积输出尺寸：

$$

H_{out}=
\left\lfloor
\frac{H_{in}+2P-K}{S}
\right\rfloor+1

$$

$$

W_{out}=
\left\lfloor
\frac{W_{in}+2P-K}{S}
\right\rfloor+1

$$

其中：

- $K$：kernel size；
- $P$：padding；
- $S$：stride。

卷积参数量：

$$

K_hK_wC_{in}C_{out}+C_{out}

$$

有 bias 加 $C_{out}$，无 bias 不加。

Pooling 不改变 channel 数。

**Padding 作用：**

1. 防止 spatial shrinkage；
2. 保留边界信息。

Zero padding：边界补 0，简单但可能引入边界突变。
Replicate padding：复制边界值，更连续。

---

## 6. Canny Edge Detection

流程：

1. Gaussian smoothing / derivative of Gaussian；
2. 计算 gradient magnitude + direction；
3. NMS；
4. hysteresis thresholding + edge linking。

边缘：

$$

\text{large } \|\nabla I\|

$$

Derivative of Gaussian：

$$

\nabla(G_\sigma * I)=(\nabla G_\sigma)*I

$$

意思：先平滑再求导 = 用 Gaussian derivative filter 卷原图。

### NMS

目的：把宽边缘响应压成单像素细边缘。

规则：沿 **gradient direction** 比较前后邻居，只有当前点是局部最大才保留。

**易错：** NMS 沿梯度方向，不是沿边缘方向。

### Hysteresis Thresholding

两个阈值：

$$

T_{high},\quad T_{low}

$$

规则：

- $M>T_{high}$：strong edge，保留；
- $M<T_{low}$：non-edge，删除；
- $T_{low}\le M\le T_{high}$：weak edge，若连到 strong edge 则保留，否则删除。

**易错：**

- Canny 不是 single threshold；
- weak edge 不一定删，连到 strong edge 可保留；
- 提高 high threshold 通常会减少 strong edges。

---

## 7. Line Fitting：Least Squares

直线：

$$

y=mx+b

$$

残差：

$$

r_i=y_i-mx_i-b

$$

目标：

$$

E=\sum_i(y_i-mx_i-b)^2

$$

矩阵形式：

$$

Y=XB

$$

$$

X=
\begin{bmatrix}
x_1&1\\
x_2&1\\
\vdots&\vdots\\
x_n&1
\end{bmatrix},
\quad
B=
\begin{bmatrix}
m\\
b
\end{bmatrix}

$$

最小二乘解：

$$

B=(X^TX)^{-1}X^TY

$$

**缺点：**

- 对 outlier 敏感；
- $y=mx+b$ 不能很好表示竖直线。

---

## 8. General Line Fitting + SVD

一般直线：

$$

ax+by=d

$$

即：

$$

ax+by-d=0

$$

构造：

$$

A=
\begin{bmatrix}
x_1&y_1&-1\\
x_2&y_2&-1\\
\vdots&\vdots&\vdots\\
x_n&y_n&-1
\end{bmatrix},
\quad
h=
\begin{bmatrix}
a\\
b\\
d
\end{bmatrix}

$$

目标：

$$

Ah\approx 0

$$

为避免 trivial solution $h=0$，加约束：

$$

\|h\|=1

$$

优化问题：

$$

\min_h \|Ah\|\quad s.t.\quad \|h\|=1

$$

SVD：

$$

A=UDV^T

$$

解：

$$

h=\text{最小奇异值对应的 right singular vector}

$$

即 $V$ 的最后一列。

**易错：** 不是最大奇异值，是最小奇异值。

---

## 9. RANSAC

RANSAC = Random Sample Consensus。

流程：

1. 随机抽 minimal sample；
2. 拟合 hypothesis/model；
3. 用所有点统计 inliers；
4. 重复多次；
5. 选 inlier set 最大的模型；
6. 可用 best inliers 重新拟合。

点到直线距离：

$$

r_i=\frac{|ax_i+by_i-d|}{\sqrt{a^2+b^2}}

$$

Inlier 条件：

$$

r_i<\delta

$$

迭代次数：

$$

N=\frac{\log(1-p)}{\log(1-w^s)}

$$

其中：

- $p$：希望成功概率；
- $w$：inlier ratio；
- $s$：每次拟合所需最少点数；
- $N$：hypothesis 数。

推导：

$$

P(\text{至少一次成功})=1-(1-w^s)^N

$$

**易错：**

- RANSAC 用 minimal sample，不是 maximum sample；
- 适合 outlier 多的情况；
- 选 largest inlier set；
- refit 后 model 和 inlier set 都可能改变。

---

## 10. Harris Corner Detector

核心：看局部窗口小位移后变化是否大。

窗口平移误差：

$$

E(u,v)=\sum_{x,y}W(x,y)[I(x+u,y+v)-I(x,y)]^2

$$

Taylor approximation：

$$

I(x+u,y+v)\approx I(x,y)+I_xu+I_yv

$$

所以：

$$

E(u,v)\approx
\begin{bmatrix}
u&v
\end{bmatrix}
M
\begin{bmatrix}
u\\
v
\end{bmatrix}

$$

Structure tensor：

$$

M=
W*
\begin{bmatrix}
I_x^2&I_xI_y\\
I_xI_y&I_y^2
\end{bmatrix}

$$

也可写成窗口加权求和：

$$

M=
\begin{bmatrix}
\sum W I_x^2&\sum W I_xI_y\\
\sum W I_xI_y&\sum W I_y^2
\end{bmatrix}

$$

其中 $W$ 通常是 Gaussian window。

### 特征值解释

$$

\lambda_1,\lambda_2

$$

- flat：两个都小；
- edge：一个大，一个小；
- corner：两个都大。

### Harris Response

$$

R=\det(M)-k(\operatorname{trace}(M))^2

$$

$$

\det(M)=\lambda_1\lambda_2

$$

$$

\operatorname{trace}(M)=\lambda_1+\lambda_2

$$

所以：

$$

R=\lambda_1\lambda_2-k(\lambda_1+\lambda_2)^2

$$

判断：

- corner：large positive $R$；
- edge：negative $R$；
- flat：near zero $R$。

### 变换性质

Rotation：response 不变。
原因：特征值不变，所以 det/trace 不变。

Translation：对应物理点 response 不变。

Scaling / compression：response 会变，因为 Harris 不天然 scale invariant。

Grayscale inversion：

$$

I'=255-I

$$

$$

I_x'=-I_x,\quad I_y'=-I_y

$$

但：

$$

(I_x')^2=I_x^2

$$

$$

(I_y')^2=I_y^2

$$

$$

I_x'I_y'=I_xI_y

$$

所以 $M$ 不变，$R$ 不变。

**易错：**

- Harris 看的是局部窗口，不是单个中心 pixel；
- $M$ 是窗口内梯度乘积统计；
- Harris rotation invariant，但不是 scale invariant。

---

## 11. ANMS 简略版

ANMS = Adaptive Non-Maximal Suppression。

作用：选出 **强且空间分布更均匀** 的角点。

普通 top- $N$ Harris 可能让角点集中在纹理丰富区域；ANMS 会 suppress 离更强角点太近的点，让 feature points 分布更均匀。

一句话：
**ANMS 不只是选 response 最大的点，还考虑空间分布。**

---

## 12. Hough Transform 简略版

Hough：用 parameter space voting 检测线。

常用直线表示：

$$

\rho=x\cos\theta+y\sin\theta

$$

避免 $y=mx+b$ 的竖直线 infinite slope 问题。

Image point 在 Hough space 里对应一条曲线；多个共线点的曲线交于 accumulator peak，该 peak 对应检测到的线。

一句话：
**Hough 是 voting，不是 RANSAC 的 random sampling。**

---

## 13. im 2 col / GEMM / GPU Convolution

每个位置卷积 = patch vector 和 kernel vector 做 dot product。

Patch flatten：

$$

p\in \mathbb{R}^{K^2 C}

$$

Kernel flatten：

$$

w\in \mathbb{R}^{K^2 C}

$$

输出：

$$

y=w^Tp

$$

im 2 col：

$$

X_{col}\in \mathbb{R}^{K^2 C_{in}\times N}

$$

其中：

$$

N=H_{out}W_{out}

$$

Kernel matrix：

$$

W_{row}\in \mathbb{R}^{C_{out}\times K^2 C_{in}}

$$

矩阵乘法：

$$

Y=W_{row}X_{col}

$$

$$

Y\in \mathbb{R}^{C_{out}\times N}

$$

最后 reshape 成：

$$

H_{out}\times W_{out}\times C_{out}

$$

GEMM = General Matrix Multiplication。

为什么适合 GPU？

- 不同 spatial location 计算相互独立；
- 可以并行；
- 卷积可转成矩阵乘法。

Toeplitz matrix：

- 概念上可行；
- 但矩阵很稀疏，很多 0；
- memory-inefficient。

**易错：**

- GEMM 不是 Gaussian Edge Magnitude Matching；
- im 2 col 是把 sliding windows 变成 columns；
- 卷积不同位置天然可并行。

---

## 14. 高频 T/F 陷阱

1. Canny 检测亮的像素。**F**
2. Edge 是 intensity 变化大的地方。**T**
3. Gradient direction 与 edge direction 平行。**F**
4. NMS 沿 gradient direction 比较。**T**
5. Hysteresis 只用 single threshold。**F**
6. Weak edge 连到 strong edge 可以保留。**T**
7. Least squares 对 outlier robust。**F**
8. RANSAC 选 largest inlier set。**T**
9. RANSAC 每次用最多点生成 hypothesis。**F**
10. $y=mx+b$ 能很好表示竖直线。**F**
11. General line fitting 需要 $\|h\|=1$。**T**
12. SVD 解用最大奇异值对应向量。**F**
13. Harris flat region 两个特征值都大。**F**
14. Harris corner 两个特征值都大。**T**
15. Harris 天然 scale invariant。**F**
16. 灰度反转改变 Harris response。**F**
17. Hough 是 parameter space voting。**T**
18. Hough 是 random sampling。**F**
19. Moving average 是 low-pass。**T**
20. Low-pass 可以完美保留边缘。**F**
21. im 2 col 把卷积转成矩阵乘法。**T**
22. Toeplitz convolution matrix 很 memory-efficient。**F**

---

## 15. 短答模板

### Canny 模板

Canny 先用 Gaussian smoothing 降噪，再计算梯度幅值和方向；然后用 NMS 沿梯度方向保留局部最大值，把宽边缘压成细边缘；最后用 hysteresis thresholding 的高低双阈值连接 strong edge 和 weak edge。

---

### RANSAC 模板

RANSAC 反复随机抽取拟合模型所需的最少点数，生成 hypothesis；然后在全体数据上根据距离阈值统计 inliers；最后选择 inlier 数最多的模型。它对 outliers robust。

---

### Harris 模板

Harris 衡量局部窗口在小位移下的变化。Structure tensor

$$

M=W*
\begin{bmatrix}
I_x^2&I_xI_y\\
I_xI_y&I_y^2
\end{bmatrix}

$$

统计窗口内梯度分布。两个特征值都小是 flat，一个大一个小是 edge，两个都大是 corner。Response：

$$

R=\det(M)-k(\operatorname{trace}M)^2

$$

large positive 表示 corner，negative 表示 edge，near zero 表示 flat。

---

### im 2 col 模板

im 2 col 把每个 local patch 拉平成列向量，把所有 patch 组成矩阵；kernel 也 flatten 成矩阵，然后用 GEMM 做矩阵乘法，最后 reshape 回 feature map。这样可以利用 GPU 并行计算。


# CV 导论期中 Cheat Sheet：Lecture 4–6 Deep Learning 部分

### 1. Equivariance vs Invariance

**Invariance 不变性：**

$$

f(T(X))=f(X)

$$

输入变换后，输出不变。
适合：分类任务，例如图像平移一点，仍然是猫。

**Equivariance 等变性：**

$$

f(T(X))=T(f(X))

$$

输入怎么变，输出跟着怎么变。
适合：keypoint / corner detection。图像平移，角点坐标也应平移。

**关键区别：**

- 分类：希望 invariant。
- 检测/定位：希望 equivariant。

---

### 2. Harris Corner Detector

Structure tensor：

$$

M=
W*
\begin{bmatrix}
I_x^2 & I_xI_y\\
I_xI_y & I_y^2
\end{bmatrix}

$$

Harris response：

$$

\theta=\det(M)-k(\operatorname{trace}(M))^2

$$

其中：

$$

\det(M)=\lambda_1\lambda_2

$$

$$

\operatorname{trace}(M)=\lambda_1+\lambda_2

$$

**Eigenvalues 判断局部结构：**

| $\lambda_1,\lambda_2$ | 区域 |
|---|---|
| 都小 | flat region |
| 一个大一个小 | edge |
| 两个都大 | corner |

**Harris 性质：**

- 对 2D translation：equivariant
- 对 image rotation：equivariant
- 对 scale：不是 invariant / equivariant
- 对 grayscale inversion：response 不变

**为什么 translation equivariant？**

梯度、逐点平方/乘积、卷积都对平移等变；尤其核心是：

$$

T(I*g)=(TI)*g

$$

卷积/相关对 translation equivariant。

**为什么 rotation equivariant？**

Gaussian kernel 是 isotropic，各向同性，因此 kernel 本身 rotation invariant；用它做卷积时，卷积 operator 对图像 rotation equivariant。

注意说法：

> Gaussian kernel is rotation invariant.
> Gaussian convolution operator is rotation equivariant.

不要说 convolution 是 rotation invariant。

**灰度反转：**

$$

I_{\text{new}}=c-I

$$

$$

I_{x,\text{new}}=-I_x,\quad I_{y,\text{new}}=-I_y

$$

但：

$$

(-I_x)^2=I_x^2

$$

$$

(-I_y)^2=I_y^2

$$

$$

(-I_x)(-I_y)=I_xI_y

$$

所以 $M$ 不变，$\theta$ 不变。

---

### 3. Classical CV Pipeline

经典流程：

$$

\text{Detector} \rightarrow \text{Descriptor} \rightarrow \text{Representation} \rightarrow \text{Classifier}

$$

对应理解：

| 模块 | 作用 |
|---|---|
| Detector，例如 Harris | where to look |
| Descriptor，例如 SIFT | what is around that point |
| Representation，例如 BoVW | how the whole image is |
| Classifier，例如 SVM | decision |

**SIFT：**

$$

16\times16 \text{ patch}

$$

分成：

$$

4\times4

$$

每个 subregion 做 8-bin gradient histogram：

$$

4\times4\times8=128

$$

所以 SIFT descriptor 是 128 维。

**BoVW：**

局部 descriptor 数量不定，需要 aggregation 成固定长度向量：

1. 收集 descriptors。
2. 聚类成 $K$ 个 visual words。
3. 每个 descriptor 分配到最近 visual word。
4. 统计 histogram：

$$

z\in \mathbb{R}^K

$$

---

### 4. 为什么 Classical CV 被 Deep Learning 取代？

Classical CV 问题：

- 手工设计特征，依赖经验。
- pipeline 分阶段，误差会传播。
- 擅长 low-level edges/corners/textures，不擅长 high-level semantics。
- 泛化差。
- 数据变多也不能自动提升很多。

Learning-based CV 优势：

- learn features from data
- end-to-end optimization
- hierarchical semantic representations

---

### 5. Logistic Regression、MLE、NLL

二分类：

$$

h_\theta(x)=g(\theta^Tx)

$$

sigmoid：

$$

g(z)=\frac{1}{1+e^{-z}}

$$

概率：

$$

p(y=1|x;\theta)=h_\theta(x)

$$

$$

p(y=0|x;\theta)=1-h_\theta(x)

$$

合并：

$$

p(y|x;\theta)=h_\theta(x)^y(1-h_\theta(x))^{1-y}

$$

所有样本独立：

$$

p(Y|X;\theta)=\prod_{i=1}^{n}p(y^{(i)}|x^{(i)};\theta)

$$

最大化 likelihood 等价于最小化 negative log-likelihood：

$$

\mathcal{L}(\theta)=-\log p(Y|X;\theta)

$$

$$

=-
\sum_{i=1}^{n}
\left[
y^{(i)}\log h_\theta(x^{(i)})
+
(1-y^{(i)})\log(1-h_\theta(x^{(i)}))
\right]

$$

---

### 6. MLP / Fully Connected Layer

一层 MLP：

$$

h=\sigma(Wx+b)

$$

**Fully connected：** 下一层每个 neuron 都和上一层所有 neuron 相连。

**Bias 作用：**

调节 neuron 的 activation threshold，相当于平移激活函数。

**为什么需要非线性 activation？**

如果没有非线性，多层线性仍是线性：

$$

W_3(W_2(W_1x))=(W_3W_2W_1)x

$$

所以没有 activation，深层网络等价于一层 linear layer。

---

### 7. ReLU

$$

\operatorname{ReLU}(x)=\max(0,x)

$$

优点：

- 计算便宜，只需 threshold。
- 正半轴梯度为 1，缓解 vanishing gradient。
- 优化更快。
- 产生 sparse activation，负值变 0。

---

### 8. 为什么 MLP 不适合图像？

问题 1：参数多。
例如 $32\times32\times3$ 图像 flatten：

$$

32\times32\times3=3072

$$

接 10 维 FC：

$$

3072\times10+10

$$

问题 2：破坏 local structure。
上下左右邻近的像素 flatten 后空间关系不明显。

总结：

> MLP ignores 2D spatial structure and is parameter-expensive.

---

### 9. CNN 核心思想

CNN 两个 inductive bias：

1. **Local connectivity 局部连接**
   每个 neuron 只看局部窗口。

2. **Parameter sharing 参数共享**
   同一个 filter 在所有 spatial locations 使用。

**Filter depth：**

输入是 $H\times W\times C_{in}$，则一个 filter 的 depth 必须是 $C_{in}$。

例如 RGB 图像用 $5\times5$ filter：

$$

5\times5\times3

$$

一个 filter 输出一个 activation map。
$K$ 个 filters 输出 $K$ 个 channels。

---

### 10. Conv 输出尺寸

输入 $H\times W$，filter size $F$，padding $P$，stride $S$：

$$

H_{out}=
\left\lfloor
\frac{H+2P-F}{S}
\right\rfloor+1

$$

$$

W_{out}=
\left\lfloor
\frac{W+2P-F}{S}
\right\rfloor+1

$$

输出 channel 数：

$$

C_{out}= \text{number of filters}

$$

**常见保持尺寸：**

当 $S=1$，$F$ 为奇数时：

$$

P=\frac{F-1}{2}

$$

例如：

- $3\times3$：padding 1
- $5\times5$：padding 2
- $7\times7$：padding 3

---

### 11. Conv 参数量

$$

F_HF_WC_{in}C_{out}+C_{out}

$$

最后 $+C_{out}$ 是 bias。

例：输入 $64\times64\times3$，$5\times5$ conv，输出 32 channels：

$$

5\times5\times3\times32+32=2432

$$

参数量与输入 spatial size $H,W$ 无直接关系。

---

### 12. FC vs Conv

FC 参数量：

输入 $W_1\times H_1\times C$，输出 $W_2\times H_2\times K$：

$$

W_1H_1CW_2H_2K

$$

Conv 参数量：

$$

F^2CK

$$

**FC 是 CNN 的 super set**，表达能力更 general。
但 CNN 更适合图像，因为：

- 参数少
- 保留 spatial structure
- local connectivity
- parameter sharing
- translation equivariance
- Conv + Pooling 提供图像 prior，使优化更容易

不要写：

> CNN is more expressive than FC.

更准确：

> FC is more expressive/general, but CNN is more efficient and suitable for images.

---

### 13. Translation Equivariance of CNN

Convolution 对 translation equivariant：

$$

T(I*g)=(TI)*g

$$

所以：

> 输入图像平移，feature map 也平移。

CNN 不是天然 scale equivariant，也不是天然 rotation equivariant。需要其他机制处理 scale / rotation。

---

### 14. Pooling

常见：

- max pooling
- average pooling
- sum pooling rarely

Pooling 参数量：

$$

0

$$

作用：

- 降低 spatial resolution
- 增大 effective receptive field
- 引入对小平移/小旋转的 invariance

**Conv + Pooling as prior：**

- Conv：translation equivariance
- Pooling：small local invariance
- 所以 CNN 比 FC 更适合图像、更容易优化

---

### 15. Receptive Field

一层 $3\times3$ conv：看输入 $3\times3$。

两层 $3\times3$ conv，stride 1：effective receptive field 为 $5\times5$。

三个 $3\times3$：effective receptive field 为 $7\times7$。

多个小卷积优点：

- 参数更少
- 更多 nonlinearities
- receptive field 可变大

例如两个 $3\times3$ vs 一个 $5\times5$：

$$

2\times9C^2=18C^2 < 25C^2

$$

---

### 16. CNN 常见结构

$$

[(Conv-BN-ReLU)\times N - Pool?]\times m
-
(FC-BN-ReLU)\times K
-
FC
-
SoftMax

$$

注意：

> No BN at the last layer before Softmax.

最后一层 logits 直接进 Softmax。

---

### 17. Data Preprocessing

目的：让输入分布和尺度更稳定，使 optimization 更容易。

常见：

- mean subtraction
- normalization / scaling

答法：

> Data preprocessing normalizes input scale/distribution and helps stabilize optimization.

---

### 18. Weight Initialization

训练流程：

$$

\text{Initialize weights}
\rightarrow
\text{Forward}
\rightarrow
\text{Loss}
\rightarrow
\text{Backprop}
\rightarrow
\text{Update}

$$

初始化重要性：

- 权重太小：activation / gradient vanish
- 权重太大：activation / gradient explode
- 好初始化：让 activation / gradient scale 稳定

---

### 19. Xavier Initialization

目标：保持每层 activation / gradient variance 稳定。

常见形式：

$$

\operatorname{Var}(W)=\frac{2}{n_{in}+n_{out}}

$$

Uniform 形式：

$$

W\sim U\left[
-\sqrt{\frac{6}{n_{in}+n_{out}}},
\sqrt{\frac{6}{n_{in}+n_{out}}}
\right]

$$

适合 sigmoid / tanh。

ReLU 常用 He initialization：

$$

\operatorname{Var}(W)=\frac{2}{n_{in}}

$$

记忆：

> Xavier considers fan-in and fan-out.
> He init is better for ReLU.

---

### 20. Backpropagation / Chain Rule

Backpropagation 本质：

> 在 computational graph 上从后往前反复使用 chain rule。

若：

$$

L=f(g(x))

$$

则：

$$

\frac{\partial L}{\partial x}
=
\frac{\partial L}{\partial f}
\frac{\partial f}{\partial g}
\frac{\partial g}{\partial x}

$$

课件语言：

$$

\text{downstream gradient}
=
\text{upstream gradient}
\times
\text{local gradient}

$$

每个节点只需知道自己的 local gradient。

---

### 21. Gradient Descent

Full-batch GD：

$$

\nabla_\theta \mathcal{L}(\theta)
=
\frac{1}{N}
\sum_{i=1}^{N}
\nabla_\theta \ell_i(\theta)

$$

更新：

$$

\theta := \theta-\alpha \nabla_\theta \mathcal{L}(\theta)

$$

$\alpha$：learning rate。

太小：slow progress。
太大：overshoot，loss 不一定下降，可能 diverge。

---

### 22. SGD / Mini-batch GD

True SGD：每次用一个样本：

$$

\theta := \theta-\alpha\nabla_\theta \ell_i(\theta)

$$

Mini-batch GD：

$$

\theta :=
\theta
-
\alpha
\frac{1}{B}
\sum_{i\in \mathcal{B}_t}
\nabla_\theta \ell_i(\theta)

$$

特殊情况：

- $B=1$：pure SGD
- $B=N$：full-batch GD

优点：

- 每次便宜
- 有噪声，可能帮助逃离 saddle / poor local region
- mini-batch 平衡 stability 和 efficiency
- 适合 GPU 并行

---

### 23. Momentum / Adam

SGD 问题：

- zig-zag
- saddle point / plateau 走得慢
- mini-batch gradient noisy

Momentum：

> 累积历史速度，一致方向加速，震荡方向抵消。

Adam：

> 常用 default optimizer；constant LR 也经常可用。

总结：

- Adam：好上手，default choice。
- SGD + Momentum：可能 outperform Adam，但需要更仔细调 LR 和 schedule。

---

### 24. Learning Rate

LR 太小：

- loss 下降慢
- 需要很多 iterations

LR 合适：

- 快速下降
- 最终收敛到较低 loss

LR 太大：

- overshoot
- oscillation
- loss 不降
- loss explode / diverge

分类任务常见 LR 范围：

$$

10^{-6}\sim10^{-3}

$$

---

### 25. Iteration vs Epoch

Iteration：

> 一个 batch，一次 gradient descent step，一次参数更新。

Epoch：

> 训练集完整过一遍，包含 many iterations。

若训练集 50000，batch size 100：

$$

\text{iterations per epoch}=50000/100=500

$$

一个 epoch 后常做：

- plot train loss
- evaluate on validation
- save checkpoint

Iteration 更本质，因为它对应参数更新次数。

---

### 26. Learning Rate Schedule

核心：

> high LR at beginning, decay later.

原因：

- 前期离 minimum 远，大步走
- 后期接近 minimum，小步精修，避免震荡

StepLR：

例如 epoch 30/60/90 乘 0.1。

Cosine：

$$

\alpha_t=
\frac{1}{2}\alpha_0
\left(1+\cos(\pi t/T)\right)

$$

Linear：

$$

\alpha_t=\alpha_0(1-t/T)

$$

Inverse sqrt：

$$

\alpha_t=\frac{\alpha_0}{\sqrt{t}}

$$

---

### 27. Linear Warmup

初期参数随机，直接大 LR 可能 loss explode。

Linear warmup：

$$

\alpha_t=
\alpha_{\max}
\frac{t}{T_{\text{warmup}}}

$$

在前若干 iterations 内从 0 或小 LR 线性升到目标 LR。

作用：

> Prevent unstable updates / loss explosion at the beginning.

---

### 28. Batch Size and LR

经验规则：

> batch size 增大 $N$ 倍，initial LR 也可增大 $N$ 倍。

原因：batch 更大，gradient estimate 噪声更小、更稳定，可以走更大步。

但这是 empirical rule，不是必然定理。

---

### 29. Softmax

输入 logits：

$$

z=[z_1,\dots,z_K]

$$

Softmax：

$$

p_i=
\frac{e^{z_i}}
{\sum_{j=1}^{K}e^{z_j}}

$$

性质：

$$

p_i\ge 0

$$

$$

\sum_i p_i=1

$$

Softmax 是 activation / probability conversion，不是 loss function。

---

### 30. NLL / Cross Entropy

One-hot label 下，真实类别 $c$：

$$

L=-\log p_c

$$

Cross entropy：

$$

CE(y,p)=
-\sum_i y_i\log p_i

$$

若 $y$ 是 one-hot：

$$

CE=-\log p_c=NLL

$$

注意：

> Softmax is not a loss.
> Softmax + Cross Entropy is training paradigm.

---

### 31. KL Divergence / Cross Entropy

KL：

$$

D_{KL}(P||Q)=
\sum_x P(x)\log\frac{P(x)}{Q(x)}

$$

性质：

$$

D_{KL}(P||Q)\ge 0

$$

$$

D_{KL}(P||Q)=0 \Leftrightarrow P=Q

$$

不是 metric：

$$

D_{KL}(P||Q)\ne D_{KL}(Q||P)

$$

Cross entropy：

$$

H(P,Q)=
-\sum_x P(x)\log Q(x)

$$

关系：

$$

D_{KL}(P||Q)=H(P,Q)-H(P)

$$

若 $P$ 是 ground truth，$H(P)$ 是常数，所以最小化 CE 等价于最小化 KL。

随机初始化时，分类 CE 约为：

$$

\log(\ #classes )

$$

CE 最小值：

$$

0

$$

无上界。

---

### 32. Batch Normalization

输入 $x\in \mathbb{R}^{N\times D}$。

Train mode：

$$

\mu_j=\frac{1}{N}\sum_i x_{i,j}

$$

$$

\sigma_j^2=
\frac{1}{N}
\sum_i
(x_{i,j}-\mu_j)^2

$$

$$

\hat{x}_{i,j}
=
\frac{x_{i,j}-\mu_j}
{\sqrt{\sigma_j^2+\epsilon}}

$$

$$

y_{i,j}
=
\gamma_j\hat{x}_{i,j}+\beta_j

$$

CNN 中通常对每个 channel 统计，跨 $N,H,W$ 求均值/方差。

Test mode：

使用训练时保存的 running mean / running variance：

$$

\mu_{\text{rms}},\sigma_{\text{rms}}^2

$$

而不是当前 batch statistics。

**为什么需要 $\gamma,\beta$：**

恢复表达能力。否则所有 activation 被强制均值 0 方差 1。

**BN 放置：**

$$

FC/Conv \rightarrow BN \rightarrow activation

$$

最后 Softmax 前通常不用 BN。

---

### 33. Why BatchNorm Works?

经典解释：

> reduce internal covariate shift

现代理解更重要：

- smooths loss landscape
- stabilizes gradient scales
- allows larger learning rates
- faster convergence
- mild regularization due to batch noise
- makes model less sensitive to initialization

小 batch 问题：

batch statistics 噪声大，train mode 和 test mode statistics discrepancy 大，可能性能下降。

解决：

- LayerNorm
- InstanceNorm
- GroupNorm

GroupNorm 在 small batch 或 batch 内样本高度相关时优于 BN。

---

### 34. Underfitting / Overfitting

Underfitting：

- train error 高
- train loss 高
- 原因：model capacity 不够或 optimization 不好
- 解法：更大模型、训练更久、调 LR、BN、skip link

Overfitting：

- train error 低
- test error 高
- generalization gap 大
- 原因：模型容量相对数据太大，把 noise 当 pattern 学了
- 解法：data augmentation、regularization、dropout、BatchNorm、early stopping、更多数据

Generalization gap：

$$

\text{performance}_{train}
-
\text{performance}_{test/unseen}

$$

---

### 35. Data Augmentation

目的：

- 增加数据多样性
- 减少 overfitting
- 提高 generalization
- 缓解 class imbalance

常见：

- flipping
- cropping
- scaling
- rotation
- translation
- padding
- affine transformation
- brightness / contrast / saturation / hue

原则：

> augmentation 不能改变 label。
> 任务关心的东西必须对该变换 invariant。

例：

- 猫狗分类：horizontal flip 通常 OK。
- 6/9 数字分类：旋转 180° 不 OK。

强度：

- 太强：核心信息丢失，模型学不了。
- 太弱：没用。
- 需要人为判断或调参。

测试时通常不用随机 augmentation，除非明确使用 test-time augmentation。

---

### 36. Regularization

目标：

> Avoid model being arbitrarily complex. Prefer simpler models.

形式：

$$

\mathcal{L}
=
\mathcal{L}_{main}
+
\lambda R(W)

$$

常见 L2：

$$

\mathcal{L}
=
\mathcal{L}_{main}
+
\lambda ||W||_2^2

$$

$\lambda$ 需要仔细调。

---

### 37. Dropout

Train time：

随机关掉部分 neurons，减少 co-adaptation，防止模型过度依赖少数特征。

Test time：

不随机 drop，使用完整网络，并做尺度匹配。

常用于 large FC layers。

---

### 38. Residual Link / Skip Link

Plain very deep CNN 问题：

更深模型 train error 和 test error 都更差，不是 overfitting，而是 optimization problem。

Residual block：

$$

y=F(x)+x

$$

如果暂时学不到东西，可以令：

$$

F(x)\approx 0

$$

则：

$$

y\approx x

$$

容易表示 identity mapping。

**Backprop 角度：**

$$

\frac{\partial y}{\partial x}
=
\frac{\partial F(x)}{\partial x}
+
I

$$

identity term 给 gradient 一条 bypass，缓解梯度难以传播。

**Loss landscape 角度：**

Skip connections：

- promote flat minimizers
- prevent transition to chaotic behavior
- smooth loss landscape
- make extremely deep networks trainable

---

### 39. Training Cases 快速模板

| 现象 | 原因 | 解法 |
|---|---|---|
| train loss 高 | underfitting / optimization failure | 增大模型、训练更久、调 LR、BN、skip link、检查数据 |
| train loss 低，test loss 高 | overfitting | augmentation、regularization、dropout、early stopping、更多数据 |
| train/test 都好，新 domain 差 | domain shift | target domain data、fine-tuning、domain adaptation、更强/更多样 augmentation |

---

### 40. 易错判断题速记

**Softmax 是 loss function？**
错。Softmax 是概率转换，CE/NLL 是 loss。

**CNN 比 FC 更 expressive？**
错。FC 更 general；CNN 更适合图像。

**Conv 天然 scale equivariant？**
错。Conv 主要 translation equivariant。

**Harris 对 scale invariant？**
错。Harris 不 scale invariant。

**灰度反转 Harris response 变？**
不变。

**BN test time 用当前 batch mean/var？**
错。用 running mean/var。

**BN 没有 learnable parameters？**
错。有 $\gamma,\beta$。

**BN 最后一层 Softmax 前常用？**
通常不用。

**Data augmentation 测试时也必须用？**
通常错。训练用，测试通常原图。

**更深 plain CNN training error 更高是 overfitting？**
错。training error 也更高，是 optimization problem。

**Dropout test time 继续随机 drop？**
错。test time 用完整网络并尺度匹配。

**KL divergence 是 metric？**
错。不对称，不满足 triangle inequality。

**SGD 一定收敛 global minimum？**
错。深度网络非凸。

**Conv layer 参数量与输入 H,W 有关？**
错。主要与 filter size、$C_{in}$、$C_{out}$ 有关。

---

### 41. 高频公式总表

$$

f(TX)=f(X)
\quad \text{invariance}

$$

$$

f(TX)=T(fX)
\quad \text{equivariance}

$$

$$

M=
W*
\begin{bmatrix}
I_x^2 & I_xI_y\\
I_xI_y & I_y^2
\end{bmatrix}

$$

$$

\theta=\det(M)-k(\operatorname{trace}(M))^2

$$

$$

H_{out}=
\left\lfloor
\frac{H+2P-F}{S}
\right\rfloor+1

$$

$$
\ ConvParams =
F_HF_WC_{in}C_{out}+C_{out}

$$

$$

\operatorname{ReLU}(x)=\max(0,x)

$$

$$

\sigma(z)=\frac{1}{1+e^{-z}}

$$

$$

p_i=
\frac{e^{z_i}}
{\sum_j e^{z_j}}

$$

$$

CE(y,p)=
-\sum_i y_i\log p_i

$$

$$

NLL=-\log p_{\text{correct}}

$$

$$

D_{KL}(P||Q)=
\sum_x P(x)\log\frac{P(x)}{Q(x)}

$$

$$

H(P,Q)=
-\sum_x P(x)\log Q(x)

$$

$$

\theta :=
\theta-\alpha\nabla_\theta \mathcal{L}(\theta)

$$

$$

\theta :=
\theta-
\alpha
\frac{1}{B}
\sum_{i\in\mathcal{B}_t}
\nabla_\theta\ell_i(\theta)

$$

$$

\alpha_t=
\frac{1}{2}\alpha_0(1+\cos(\pi t/T))

$$

$$

\alpha_t=
\alpha_{\max}\frac{t}{T_{\text{warmup}}}

$$

$$

\hat{x}=
\frac{x-\mu}{\sqrt{\sigma^2+\epsilon}}

$$

$$

y=\gamma\hat{x}+\beta

$$

$$

\mathcal{L}
=
\mathcal{L}_{main}
+
\lambda R(W)

$$

$$

y=F(x)+x

$$

$$

\frac{\partial y}{\partial x}
=
\frac{\partial F(x)}{\partial x}
+
I

$$

---

我建议你排版时把它压成两面：**第一面放 Harris/CNN/Conv/Softmax/BN 公式，第二面放 optimization/backprop/regularization/residual link/易错判断题**。



# CV Midterm Cheat Sheet：Lecture 7–8 核心

### 1. CNN Training：Underfitting vs Overfitting

**Underfitting on train set**
训练集上 loss 都高，说明模型没学好。常见原因：

- model capacity 不够；
- optimization 不好；
- 网络太深导致 gradient 难传；
- learning rate 不合适。

解决：

- 增大模型 capacity；
- Batch Normalization；
- Skip link / ResNet；
- 调 learning rate / optimizer。

**Overfitting on test / validation set**
train loss 很低，但 validation / test loss 高，generalization gap 大。常见原因：

- model 太强而 data 不够；
- 学到了训练集 noise / accidental pattern；
- 数据分布不够丰富。

解决：

- data augmentation；
- regularization；
- dropout；
- early stopping；
- 收集更多数据。

**诊断模板**

| 现象 | 问题 | 解决 |
|---|---|---|
| train loss 高，test loss 也高 | underfitting / optimization | 增大模型、BN、skip link、调 LR |
| train loss 低，test loss 高 | overfitting | augmentation、regularization、dropout、early stopping |
| train/test 都好，新 domain 差 | domain shift | 收集目标域数据、domain adaptation、增强数据多样性 |

---

### 2. Batch Normalization

对 CNN 输入 $x\in\mathbb{R}^{N\times C\times H\times W}$，BN 通常对每个 channel 统计 batch 和 spatial 上的均值方差：

$$

\mu_c=\frac{1}{NHW}\sum_{n,h,w}x_{n,c,h,w}

$$

$$

\sigma_c^2=\frac{1}{NHW}\sum_{n,h,w}(x_{n,c,h,w}-\mu_c)^2

$$

$$

\hat{x}_{n,c,h,w}=\frac{x_{n,c,h,w}-\mu_c}{\sqrt{\sigma_c^2+\epsilon}}

$$

$$

y_{n,c,h,w}=\gamma_c\hat{x}_{n,c,h,w}+\beta_c

$$

**train time**：用当前 mini-batch 的 mean / variance，并更新 running mean / variance。
**test time**：用 training 时累计的 running mean / variance。

$\gamma,\beta$ 的作用：恢复表达能力。否则 BN 会强制输出 zero mean / unit variance，限制网络学习合适的 scale 和 shift。

**小 batch 问题**：batch mean / variance 估计不稳定。
替代：LayerNorm / GroupNorm / InstanceNorm 等，不依赖 batch dimension。

---

### 3. ResNet / Skip Link / Residual Link

深层 plain CNN 可能出现：

- 56-layer 比 20-layer 的 train error 还高；
- 这不是 overfitting，因为 train error 也更差；
- 说明是 optimization problem。

**Residual block**

$$

H(x)=F(x)+x

$$

如果：

$$

F(x)=0

$$

则：

$$

H(x)=x

$$

也就是 identity mapping。新增层可以“什么都不做”，至少不破坏已有表示。

**Residual 的含义**

$$

F(x)=H(x)-x

$$

网络学的是 residual，而不是直接学完整 mapping。

**Skip link 作用**

Forward：

- 提供 identity shortcut；
- 让新增层初始时近似无害；
- 深层网络更容易退化成浅层网络。

Backward：

- 给 gradient 提供 bypass；
- 避免梯度必须穿过所有层的连乘；
- 底层 low-level feature extractor 更容易被 update。

**Loss landscape 角度**

Skip connection 让 loss landscape 更 smooth / flat，避免 chaotic behavior，有利于训练 very deep networks。

---

### 4. Generalization Gap / Early Stopping

**Generalization gap**

$$

\text{Gap}=\text{train performance}-\text{validation/test performance}

$$

overfitting 本质：模型把 residual variation / noise 当成 underlying structure 学了。

**Early stopping**

观察 validation accuracy / loss：

- train accuracy 继续上升；
- validation accuracy 持平或下降；
- 此时应保存 best validation checkpoint，而不是等 train loss 最低。

Early stopping 不是从本质上解决 overfitting，而是流程控制，防止继续 memorization。

---

### 5. Data Augmentation

核心：

> 对 image 做变换，但 label 必须保持不变。

也就是：

$$

y(T(x))=y(x)

$$

augmentation 合理条件：

1. transformation must be label-invariant；
2. 变换后 human 仍能识别 class；
3. 模拟 test distribution 中真实可能出现的 variation；
4. magnitude 不能太强也不能太弱。

常见 variation 与 augmentation：

| variation | augmentation |
|---|---|
| pose / viewpoint | rotation, affine, crop, scale |
| illumination | brightness, contrast, color jitter |
| object position | translation, padding, crop |
| left-right variation | horizontal flip |
| occlusion | random crop / cutout 类思想 |

**陷阱**

Horizontal flip 不是总安全。
猫狗分类通常安全；left hand vs right hand 不安全，因为 label 会变。

Crop 太强也不行：如果猫被 crop 没了但 label 仍是 cat，会引入 label noise。

---

### 6. Regularization / Dropout

Regularized loss：

$$

L(W)=\frac{1}{N}\sum_i L_i(f(x_i,W),y_i)+\lambda R(W)

$$

作用：

- 惩罚过复杂模型；
- 防止 decision boundary 过度弯曲；
- 避免拟合 noise；
- 减小 generalization gap。

$\lambda$ 要 carefully choose。太小没用，太大 underfit。

Dropout：训练时随机 drop neurons/features，减少 co-adaptation，起 ensemble-like regularization 作用；test time 通常不用随机 dropout，而用完整网络或 scaled activations。

---

### 7. CNN Architecture / Backbones

分析 CNN architecture 的四个角度：

1. **Capacity / Expressivity**：表达能力够不够；
2. **Fitness for task**：是否适合任务；
3. **Optimization properties**：是否容易训练；
4. **Cost**：参数量、计算量、显存、推理速度。

ImageNet 特点：

- 1000 classes；
- 细粒度类别多，比如很多 dog breeds；
- 需要同时看 local details 和 global context。

**Receptive field**

一个 feature 对应原图中能“看到”的区域。

多层 $3\times3$ conv 可以增加 effective receptive field，同时引入更多 nonlinearity，并且参数可能少于一个大 kernel。

例如两个 $3\times3$ conv 的 receptive field 类似 $5\times5$，三个 $3\times3$ conv 类似 $7\times7$。

---

### 8. Semantic Segmentation

任务：

> per-pixel classification

输入：

$$

H\times W\times 3

$$

输出：

$$

H\times W\times C

$$

每个 pixel 输出 $C$ 类 score / probability。

与 classification 区别：

- classification：整张图一个 label；
- semantic segmentation：每个 pixel 一个 semantic label；
- 不区分同类不同 instance。

---

### 9. FCN / Bottleneck / Transposed Conv

**FCN：Fully Convolutional Network**

把全连接换成卷积，使网络可以输出 spatial score map。

为什么需要 encoder-decoder / bottleneck？

1. 保持原分辨率一路卷太 expensive；
2. 降低 resolution 后，receptive field 增长更快；
3. bottleneck 能编码 global context；
4. decoder 再恢复 spatial resolution。

**Bottleneck 要存什么？**

纯 FCN 中，bottleneck 既要存：

- global context；
- precise boundary；
- 甚至 per-pixel segmentation detail。

这太难，容易变成“记忆压缩原图”。

**Transposed Convolution**

一种 learnable upsampling。
kernel size 和 stride 决定 resolution 如何上升。

注意：transposed conv 不是普通 conv 的严格数学逆；它是 learnable 的上采样操作。

---

### 10. U-Net

U-Net 关键：

> encoder 和 decoder 相同 resolution 的 feature map 之间加 skip connection，通常用 concatenation。

不是 ResNet 那种 addition residual link，而是 channel-wise concat：

$$

F_{\text{decoder}}'=\text{concat}(F_{\text{encoder}},F_{\text{decoder}})

$$

作用：

- encoder 浅层 feature 提供 high-resolution spatial detail；
- decoder / bottleneck 提供 semantic / global context；
- bottleneck 不必记住所有 pixel-level boundary；
- 避免 memorization；
- segmentation boundary 更准。

**U-Net bottleneck 主要负责**

- compact global context；
- high-level semantic information；
- large receptive field；
- 去掉 redundant information；
- 降低 computation cost。

**Skip link 负责**

- assist final segmentation；
- preserve spatial information；
- avoid bottleneck memorizing pixel-level details。

---

### 11. Segmentation Evaluation：Pixel Accuracy / IoU / mIoU

**Pixel Accuracy**

$$

\text{Pixel Accuracy}=\frac{\#\text{correct pixels}}{\#\text{all pixels}}

$$

问题：类别不平衡时 misleading。
如果 insect 只占 1%，模型全部预测 background，也可能 99% accuracy。

**IoU：Intersection over Union**

对某一类：

$$

IoU=\frac{|P\cap G|}{|P\cup G|}

$$

其中：

- $P$：predicted mask；
- $G$：ground-truth mask。

用 TP / FP / FN 表示：

$$

IoU=\frac{TP}{TP+FP+FN}

$$

优点：

- 不被大量 true negative 背景主导；
- box / mask 太大、太小都不行；
- 完全重合时 IoU = 1；
- 无交集时 IoU = 0。

**mIoU**

$$

mIoU=\frac{1}{C}\sum_{c=1}^{C}IoU_c

$$

即对所有 semantic classes 的 IoU 求平均。

**Soft IoU Loss**

硬 IoU 不可导，因为 argmax / mask assignment 是离散的。
可用概率构造 soft IoU：

$$

I(X)=\sum_{v\in V}X_vY_v

$$

$$

U(X)=\sum_{v\in V}(X_v+Y_v-X_vY_v)

$$

$$

L_{IoU}=1-\frac{I(X)}{U(X)}

$$

---

### 12. Object Detection 基础

Object Detection = localization + classification。

输出：

$$

\{(b_i,c_i,s_i)\}_{i=1}^{N}

$$

其中：

- $b_i$：bounding box；
- $c_i$：class label；
- $s_i$：confidence score；
- $N$：每张图不固定。

Axis-aligned 2D bounding box：4 DoF，可用：

$$

(x,y,w,h)

$$

或：

$$

(x_1,y_1,x_2,y_2)

$$

---

### 13. Single-object Detection

如果每张图只有一个 object：

CNN 输出：

1. class scores；
2. box coordinates。

Loss：

$$

L=L_{\text{cls}}+\lambda L_{\text{box}}

$$

分类用 softmax / cross entropy；
定位用 regression loss。

---

### 14. Regression Loss for Box

设预测误差为 $\Delta$。

**L1**

$$

L_1=\sum|\Delta|

$$

robust to large error，但收敛性质差一些。

**L2**

$$

L_2=\sum\Delta^2

$$

平滑、好收敛，但对 outlier / large error 不 robust。

**Smooth L1 / Huber-like**

$$

\text{smooth}_{L1}(x)=
\begin{cases}
0.5x^2, & |x|<1\\
|x|-0.5, & \text{otherwise}
\end{cases}

$$

小误差像 L2，大误差像 L1。Fast R-CNN 常用。

---

### 15. Multi-object Detection 难点

不同图像需要不同数量输出：

- 0 个 object；
- 1 个 object；
- 多个 object。

普通 CNN 输出固定维度向量，不自然适配 variable-size set。

解决思路：

- sliding window；
- region proposal；
- anchor boxes；
- dense prediction；
- NMS 后处理。

---

### 16. Sliding Window

思想：

> 在图像上滑动很多 windows，每个 crop 用 CNN 分类 object / background。

优点：直观。
缺点：

- window 位置多；
- scale 多；
- aspect ratio 多；
- 每个 crop 都跑 CNN，计算量巨大。

后续方法核心：共享 CNN feature，而不是每个 proposal 单独跑 CNN。

---

### 17. Two-stage vs One-stage Detector

**Two-stage detector**

代表：R-CNN / Fast R-CNN / Faster R-CNN。

流程：

1. region proposal；
2. classify + refine boxes。

优点：精度通常高。
缺点：慢，pipeline 复杂。

**One-stage detector**

代表：YOLO / SSD / RetinaNet。

流程：

> 不单独 proposal，直接在 dense feature map locations 上预测 boxes + classes。

优点：快，real-time。
缺点：早期对小物体、密集物体、class imbalance 较难。

---

### 18. YOLO 思想

YOLO = You Only Look Once。

核心：

1. 整张图只通过 CNN 一次；
2. 把图像 / feature map 分成 grid；
3. 每个 grid cell / feature location 预测若干 boxes；
4. 每个 box 输出：
   - box coordinates；
   - objectness；
   - class probabilities。

输出是 dense prediction tensor，而不是单个 classification vector。

早期 YOLO 局限：

- 多个 object center 落在同一 grid cell 时困难；
- 小物体 / 密集物体表现较差。

---

### 19. Anchor Boxes

Anchor box = predefined reference box。

每个 feature location 预设多个不同：

- scale；
- aspect ratio。

网络预测：

- anchor 是否有 object；
- class score；
- 相对于 anchor 的 offset / refinement。

常见 box transform：

$$

t_x=\frac{x-x_a}{w_a},\quad t_y=\frac{y-y_a}{h_a}

$$

$$

t_w=\log\frac{w}{w_a},\quad t_h=\log\frac{h}{h_a}

$$

其中 anchor 为 $(x_a,y_a,w_a,h_a)$，ground truth / predicted box 为 $(x,y,w,h)$。

作用：

1. 降低 box regression 难度；
2. 覆盖不同大小和形状 object；
3. dense detection 更稳定。

Anchor 不是 final detection；final box = anchor + predicted offsets。

---

### 20. IoU in Detection

对两个 boxes：

$$

IoU=\frac{\text{area}(B_p\cap B_g)}{\text{area}(B_p\cup B_g)}

$$

用途：

1. 判断 prediction 是否 TP；
2. 给 anchor 分 positive / negative；
3. NMS 中判断 boxes 是否重复。

Detection TP 条件通常：

- class correct；
- IoU with unmatched ground truth $\ge$ threshold。

常见 threshold：0.5，或 COCO 使用多个 threshold。

注意：IoU 高只说明位置重合好，不保证 class 对。

---

### 21. NMS：Non-Maximum Suppression

目的：去掉同一个 object 的重复框。

流程：

1. 按 confidence score 从高到低排序；
2. 取最高分 box，保留；
3. 计算它与剩余 boxes 的 IoU；
4. 删除 IoU 大于阈值的低分 boxes；
5. 重复直到没有 box。

NMS 使用的是 **predicted boxes 之间的 IoU**，不是 prediction 和 ground truth 的 IoU。

阈值影响：

- threshold 太低：容易误删相邻 objects；
- threshold 太高：保留太多 duplicate boxes。

NMS 是 greedy post-processing，不保证全局最优。

---

### 22. Precision / Recall / AP / mAP

Detection 中：

**TP**：class 正确，IoU 达标，并且 GT 未被匹配过。
**FP**：class 错、IoU 不够、或重复检测同一 GT。
**FN**：GT object 没被检测到。

$$

Precision=\frac{TP}{TP+FP}

$$

$$

Recall=\frac{TP}{TP+FN}

$$

Prediction 按 confidence 从高到低排序。
逐步降低 threshold，得到 precision-recall curve。

**AP：Average Precision**

某一类别的 precision-recall curve 面积。

**mAP：mean AP**

$$

mAP=\frac{1}{C}\sum_{c=1}^{C}AP_c

$$

mAP 同时考虑：

- classification；
- localization；
- confidence ranking；
- duplicate detections。

陷阱：

- 类别正确但 IoU 低：FP；
- 一个 GT 通常只能匹配一个 prediction；
- 重复检测同一 GT：第一个可能 TP，其余 FP；
- mAP 高不代表每个类别都好，要看 per-class AP。

---

### 23. RoI Pool

RoI = Region of Interest / proposal region。

问题：

> proposals 大小不同，但后续 classifier / regressor 需要固定大小 feature。

RoI Pool 作用：

> 从 shared CNN feature map 中，把任意大小 RoI 转成固定大小 feature。

流程：

1. 整张图过 CNN，得到 shared feature map；
2. 将 proposal box 从原图坐标 project 到 feature map；
3. snap / quantize 到整数 grid cells；
4. 将 RoI 分成固定数量 bins，如 $2\times2$ 或 $7\times7$；
5. 每个 bin 内做 max pooling；
6. 得到固定大小 feature，如 $C\times7\times7$。

优点：

- 整张图只跑一次 CNN；
- 每个 proposal 在 feature map 上 pool；
- 比 R-CNN 每个 proposal 单独跑 CNN 快很多。

问题：

> quantization causes spatial misalignment。

因为：

- proposal 坐标取整；
- bin 边界取整；
- pooling 在整数 grid 上做。

对 detection 可能还行；对 mask prediction 会影响边界精度。

---

### 24. RoI Align

RoI Align 解决 RoI Pool 的 misalignment。

核心：

> no snapping / no quantization。

流程：

1. project proposal to feature map；
2. 不取整，保留 floating-point coordinates；
3. divide into fixed bins；
4. 每个 bin 中取 regular sample points；
5. sample point 可能落在小数坐标；
6. 用 bilinear interpolation 得到 feature；
7. pool sampled values，输出固定大小 RoI feature。

**Bilinear interpolation**

$$

f(x,y)=\sum_{i,j} f(x_i,y_j)\max(0,1-|x-x_i|)\max(0,1-|y-y_j|)

$$

含义：

- $(x,y)$ 是浮点采样点；
- 用周围 4 个 grid cell 的 feature 加权求和；
- 离得越近权重越大。

**RoI Pool vs RoI Align**

| 项目 | RoI Pool | RoI Align |
|---|---|---|
| 固定输出大小 | 是 | 是 |
| 坐标取整 | 是 | 否 |
| 采样 | integer grid max pool | floating sampling + bilinear interpolation |
| 问题 | misalignment | better alignment |
| 常见于 | Fast/Faster R-CNN | Mask R-CNN |
| 对 mask | 边界可能错 | 边界更准 |

一句话：

> RoI Pool = quantization + pooling；RoI Align = no quantization + bilinear interpolation。

---

## 高频判断陷阱

1. 更深网络 train error 更高，是 overfitting。
**False**。train error 也高说明 optimization / underfitting。

2. Skip link 只是增加参数量。
**False**。核心是 identity shortcut + gradient bypass。

3. Residual block 直接学 $H(x)$。
**不准确**。它学 $F(x)=H(x)-x$，输出 $F(x)+x$。

4. train loss 低、test loss 高是 underfitting。
**False**。通常是 overfitting。

5. Early stopping 应看 validation performance。
**True**。

6. Data augmentation 总是有益。
**False**。必须 label-invariant。

7. Horizontal flip 总是安全。
**False**。左右手分类不安全。

8. Test time 必须使用 train time augmentation。
**False**。augmentation 主要用于 train time。

9. Pixel accuracy 是 segmentation 最可靠指标。
**False**。类别不平衡时 misleading，mIoU 更常用。

10. U-Net skip connection 和 ResNet skip connection 完全一样。
**False**。U-Net 多为 concat spatial detail；ResNet 是 addition residual learning。

11. Object detection 只是 classification。
**False**。classification + localization。

12. Bounding box 有 4 DoF。
**True**。

13. Anchor boxes 是最终检测框。
**False**。anchor 是 reference box，网络预测 offsets。

14. IoU 高说明类别一定正确。
**False**。IoU 只衡量 overlap。

15. NMS 比较 prediction 和 ground truth。
**False**。NMS 比较 predicted boxes 之间的 IoU。

16. NMS 保证全局最优。
**False**。greedy algorithm。

17. mAP 只看分类准确率。
**False**。还看 localization、confidence ranking、duplicates。

18. RoI Pool 不会引入空间误差。
**False**。quantization 会导致 misalignment。

19. RoI Align 不做 pooling。
**False**。它不做 quantization，但仍输出 fixed-size feature。

20. RoI Align 对 mask prediction 特别重要。
**True**。因为 mask 需要 pixel-level alignment。

---

## 最短版答题模板

**Explain why skip links help train deep CNNs.**

Skip links help both forward and backward propagation. Forward: residual block outputs $H(x)=F(x)+x$, so if $F(x)=0$, the block becomes identity mapping and added layers are less harmful. Backward: skip links provide gradient bypasses, allowing gradients to reach earlier layers more easily. Therefore deep networks become easier to optimize.

**Explain overfitting and solutions.**

Overfitting means low training loss but high validation/test loss. The model learns noise or accidental patterns in training data, causing a large generalization gap. Solutions include data augmentation, regularization, dropout, early stopping, and collecting more diverse data.

**Explain U-Net.**

U-Net is an encoder-decoder segmentation architecture with skip connections between encoder and decoder features at the same resolution. The bottleneck captures global semantic context, while skip connections provide high-resolution spatial details. This reduces the need for the bottleneck to memorize pixel-level boundaries and improves segmentation accuracy.

**Explain IoU / mIoU.**

IoU measures overlap between prediction and ground truth:

$$

IoU=\frac{|P\cap G|}{|P\cup G|}=\frac{TP}{TP+FP+FN}

$$

mIoU averages IoU over all classes. It is preferred over pixel accuracy because it is less dominated by large background classes.

**Explain YOLO / one-stage detection.**

YOLO is a one-stage detector. It processes the whole image once and directly predicts bounding boxes, objectness scores, and class probabilities from dense grid or feature map locations. It is fast because it skips a separate proposal stage, but dense prediction can be harder for small or crowded objects.

**Explain NMS.**

NMS removes duplicate detections. It sorts boxes by confidence, keeps the highest-scoring box, and suppresses lower-scoring boxes with IoU above a threshold. It is a greedy post-processing method.

**Explain mAP.**

For each class, predictions are sorted by confidence. A prediction is TP only if class is correct and IoU with an unmatched ground truth is above threshold. Precision-recall curve is computed, AP is the area under this curve, and mAP is the mean AP over classes.

**Explain RoI Pool vs RoI Align.**

RoI Pool projects proposals to feature maps, quantizes coordinates to grid cells, divides each RoI into fixed bins, and max-pools each bin to get fixed-size features. Quantization causes misalignment. RoI Align removes quantization and samples floating-point locations using bilinear interpolation, preserving better spatial alignment, which is important for Mask R-CNN.
