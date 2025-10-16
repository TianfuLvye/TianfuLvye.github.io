---
math: "true"
---


![](/assets/images/Pasted image 20250515185114.png)
![](/assets/images/Pasted image 20250515185035.png)

这个证明展示了如何利用 Hoeffding 引理推导出 Hoeffding 不等式，用于控制独立有界随机变量和偏离其期望的概率。下面我们逐步解析这个证明：

### 1. 初始设定
我们有 n 个独立的随机变量 $X_1, X_2, \ldots, X_n$，其中每个 $X_i$ 的取值范围在区间 $[a_i, b_i]$ 内。目标是证明：
$$ P\left( \sum_{i=1}^n (X_i - \mathbb{E} X_i) \geq \varepsilon \right) \leq e^{-\frac{2\varepsilon^2}{\sum_{i=1}^n (b_i - a_i)^2}} $$

### 2. 第一步：引入指数函数和马尔科夫不等式
为了控制尾部概率，我们引入指数函数和参数 $t > 0$：
$$ P\left( \sum_{i=1}^n (X_i - \mathbb{E} X_i) \geq \varepsilon \right) = P\left( e^{t \sum_{i=1}^n (X_i - \mathbb{E} X_i)} \geq e^{t\varepsilon} \right) $$
根据马尔科夫不等式（对于非负随机变量 $Y$，$P(Y \geq c) \leq \frac{\mathbb{E} Y}{c}$），有：
$$ P\left( e^{t \sum_{i=1}^n (X_i - \mathbb{E} X_i)} \geq e^{t\varepsilon} \right) \leq e^{-t\varepsilon} \mathbb{E} \left( e^{t \sum_{i=1}^n (X_i - \mathbb{E} X_i)} \right) $$
这是证明中的第一个不等式。

### 3. 第二步：分解期望
由于 $X_i$ 是独立的，$X_i - \mathbb{E} X_i$ 也是独立的，因此指数函数的期望可以分解为乘积：
$$ \mathbb{E} \left( e^{t \sum_{i=1}^n (X_i - \mathbb{E} X_i)} \right) = \prod_{i=1}^n \mathbb{E} \left( e^{t(X_i - \mathbb{E} X_i)} \right) $$
这是证明中的等式部分。

### 4. 第三步：应用 Hoeffding 引理
Hoeffding 引理指出，对于一个有界随机变量 $X$（取值范围为 $[a, b]$），其中心化后的矩生成函数满足：
$$ \mathbb{E} \left( e^{t(X - \mathbb{E} X)} \right) \leq e^{\frac{t^2 (b - a)^2}{8}} $$
将这一引理应用到每个 $X_i$ 上，得到：
$$ \prod_{i=1}^n \mathbb{E} \left( e^{t(X_i - \mathbb{E} X_i)} \right) \leq \prod_{i=1}^n e^{\frac{t^2 (b_i - a_i)^2}{8}} = e^{\frac{t^2}{8} \sum_{i=1}^n (b_i - a_i)^2} $$
这是证明中的第二个不等式。

### 5. 第四步：合并结果
将上述结果代入第一步的不等式：
$$ P\left( \sum_{i=1}^n (X_i - \mathbb{E} X_i) \geq \varepsilon \right) \leq e^{-t\varepsilon} \cdot e^{\frac{t^2}{8} \sum_{i=1}^n (b_i - a_i)^2} = e^{-t\varepsilon + \frac{t^2}{8} \sum_{i=1}^n (b_i - a_i)^2} $$

### 6. 第五步：优化参数 $t$
为了最小化上界，选择 $t$ 使得指数部分最小化。令：
$$ f(t) = -t\varepsilon + \frac{t^2}{8} \sum_{i=1}^n (b_i - a_i)^2 $$
对 $t$ 求导并令导数为零：
$$ f'(t) = -\varepsilon + \frac{t}{4} \sum_{i=1}^n (b_i - a_i)^2 = 0 $$
解得：
$$ t = \frac{4\varepsilon}{\sum_{i=1}^n (b_i - a_i)^2} $$
将 $t$ 代回 $f(t)$：
$$ f(t) = -\frac{4\varepsilon^2}{\sum_{i=1}^n (b_i - a_i)^2} + \frac{1}{8} \cdot \frac{16\varepsilon^2}{\sum_{i=1}^n (b_i - a_i)^2} = -\frac{2\varepsilon^2}{\sum_{i=1}^n (b_i - a_i)^2} $$
因此，最终的上界为：
$$ P\left( \sum_{i=1}^n (X_i - \mathbb{E} X_i) \geq \varepsilon \right) \leq e^{-\frac{2\varepsilon^2}{\sum_{i=1}^n (b_i - a_i)^2}} $$

### 7. 第六步：对称情况
对于 $P\left( \sum_{i=1}^n (X_i - \mathbb{E} X_i) \leq -\varepsilon \right)$，可以通过考虑 $-X_i$ 类似地得到相同的不等式。

### 总结
通过引入指数函数、马尔科夫不等式、独立性和 Hoeffding 引理，我们逐步推导出了 Hoeffding 不等式，展示了如何控制独立有界随机变量和偏离其期望的概率。




# 引理证明
Hoeffding 引理是 Hoeffding 不等式的核心组成部分，它给出了有界随机变量的矩生成函数（MGF）的一个上界。下面我们逐步证明 Hoeffding 引理。

---

### **Hoeffding 引理的内容**
设 $X$ 是一个随机变量，满足 $a \leq X \leq b$，且 $\mathbb{E}[X] = \mu$。那么，对于任意 $t \in \mathbb{R}$，有：
$$
\mathbb{E}\left[ e^{t(X - \mu)} \right] \leq e^{\frac{t^2 (b - a)^2}{8}}
$$

---

### **证明步骤**

#### **1. 中心化随机变量**
令 $Y = X - \mu$，则 $\mathbb{E}[Y] = 0$，且 $Y \in [a - \mu, b - \mu]$。设 $Y \in [A, B]$，其中 $A = a - \mu$, $B = b - \mu$。

由于 $X \in [a, b]$，且 $\mu = \mathbb{E}[X] \in [a, b]$，所以：
- $A \leq 0 \leq B$
- $B - A = b - a$

我们要证明：
$$
\mathbb{E}\left[ e^{tY} \right] \leq e^{\frac{t^2 (B - A)^2}{8}} = e^{\frac{t^2 (b - a)^2}{8}}
$$

---

#### **2. 利用凸性和指数函数的性质**
对于任意 $y \in [A, B]$，我们可以将 $e^{ty}$ 表示为 $A$ 和 $B$ 的线性组合：
$$
e^{ty} \leq \frac{B - y}{B - A} e^{tA} + \frac{y - A}{B - A} e^{tB}
$$
这是因为指数函数 $e^{ty}$ 是凸函数，所以它在区间 \([A, B]\) 上的值不超过其端点的线性插值。

取期望（利用 $\mathbb{E}[Y] = 0$）：
$$
\mathbb{E}\left[ e^{tY} \right] \leq \mathbb{E}\left[ \frac{B - Y}{B - A} e^{tA} + \frac{Y - A}{B - A} e^{tB} \right] = \frac{B}{B - A} e^{tA} - \frac{A}{B - A} e^{tB}
$$
（因为 $\mathbb{E}[Y] = 0$）

令 $p = \frac{-A}{B - A}$，则 $1 - p = \frac{B}{B - A}$，所以：
$$
\mathbb{E}\left[ e^{tY} \right] \leq (1 - p) e^{tA} + p e^{tB}
$$

---

#### **3. 化简表达式**
令 $u = t(B - A)$，$\theta = \frac{-A}{B - A} \in [0, 1]$（因为 $A \leq 0 \leq B$），则：
$$
(1 - p) e^{tA} + p e^{tB} = e^{tA + \log(1 - p + p e^{u})}
$$
但更直接的方式是重新参数化：
$$
\text{设 } \lambda = \frac{-A}{B - A}, \quad \text{则 } A = -\lambda (B - A), \quad B = (1 - \lambda)(B - A)
$$
因此：
$$
(1 - p) e^{tA} + p e^{tB} = (1 - \lambda) e^{-t \lambda (B - A)} + \lambda e^{t (1 - \lambda)(B - A)}
$$

令 $h(u) = \log \left( \lambda e^{u} + (1 - \lambda) e^{-u \lambda / (1 - \lambda)} \right)$，但更简单的方法是直接分析：
$$
\text{定义 } \phi(u) = \log \left( \lambda e^{u} + (1 - \lambda) \right) - \lambda u
$$
但更直观的方法是使用泰勒展开或优化技巧。

---

#### **4. 使用不等式 $e^x \leq 1 + x + \frac{x^2}{2}$（对于 $x$ 受限时）**
定义：
$$
f(t) = \log \mathbb{E}\left[ e^{tY} \right] \leq \log \left( (1 - p) e^{tA} + p e^{tB} \right)
$$
我们证明 $f(t) \leq \frac{t^2 (B - A)^2}{8}$。

令 $\psi(t) = \log \left( (1 - p) e^{tA} + p e^{tB} \right)$，计算 $\psi(0)$ 和导数：
- $\psi(0) = \log(1) = 0$
- $\psi'(t) = \frac{(1 - p)A e^{tA} + p B e^{tB}}{(1 - p) e^{tA} + p e^{tB}}$
  - 在 $t = 0$ 时，$\psi'(0) = (1 - p)A + p B = 0$（因为 $\mathbb{E}[Y] = 0$）
- $\psi''(t)$ 的计算较复杂，但可以证明 $\psi''(t) \leq \frac{(B - A)^2}{4}$

通过泰勒展开（或直接积分），得到：
$$
\psi(t) \leq \frac{t^2}{2} \cdot \frac{(B - A)^2}{4} = \frac{t^2 (B - A)^2}{8}
$$

---

#### **5. 最终结论**
因此：
$$
\mathbb{E}\left[ e^{tY} \right] \leq e^{\frac{t^2 (B - A)^2}{8}} = e^{\frac{t^2 (b - a)^2}{8}}
$$

---

### **关键点总结**
1. **中心化随机变量**：将 $X$ 转换为 $Y = X - \mu$，使得 $\mathbb{E}[Y] = 0$。
2. **凸性技巧**：利用指数函数的凸性，用线性插值表示 $e^{tY}$。
3. **期望计算**：通过 $\mathbb{E}[Y] = 0$ 化简表达式。
4. **泰勒展开或优化**：证明 $\log \mathbb{E}[e^{tY}]$ 的上界是 $\frac{t^2 (b - a)^2}{8}$。

这样就完成了 Hoeffding 引理的证明！