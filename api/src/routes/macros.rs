#[macro_export]
macro_rules! export_route {

    ( $method:ident,$( ($route:ident, $url:expr) ),*, $( $route2:ident ),*) => {
        $(
            mod $route;
        )*
        $(
            mod $route2;
        )*



        pub(crate) fn main() -> Vec<Route<'static>> {
            vec![
                $(
                    Route(concat!("/", $url), $method($route::main)),
                )*
                $(
                    Route(concat!("/", stringify!($route2)), $method($route2::main)),
                )*

            ]
        }
    };
    ( $method:ident, $( $route2:ident ),*, $( ($route:ident, $url:expr) ),*) => {
        $(
            mod $route;
        )*
        $(
            mod $route2;
        )*



        pub(crate) fn main() -> Vec<Route<'static>> {
            vec![
                $(
                    Route(concat!("/", $url), $method($route::main)),
                )*
                $(
                    Route(concat!("/", stringify!($route2)), $method($route2::main)),
                )*

            ]
        }
    };
}

#[macro_export]
macro_rules! merge_routes {
    ( $( $routes:expr ),+ ) => {{
        let mut merged_routes = vec![];

        $(
            merged_routes.extend($routes);
        )+

        merged_routes
    }};
}
