const cart = async (req, res) => {
    try {
        if (req.session.username) {
            let userData = await userModel.findOne({ username: req.session.username }, { _id: 1 })
            cartModel.find({ user_id: userData._id }, (err, data) => {
                let cartData = data;
                let sum = 0;
                let pqtotal=[]
                for (let i = 0; i < cartData.length; i++) {
                    sum += cartData[i].qty * cartData[i].price;
                    let total = sum;
                    cartData[i] = {...cartData[i], total};
                    // pqtotal.push(sum)
                }
                // console.log(pqtotal);

                // data.forEach((ele,index) => {
                //     ele['total'] = pqtotal[index];
                // });
                console.log(cartData);
                // res.render("cartpage", { data: data.map(data => data.toJSON()), name: req.session.username, sum: sum,pqtotal:pqtotal })
            })
        }
        else {
            return res.redirect("/login");

        }
    }
    catch (err) {
        console.log(err);
    }
}